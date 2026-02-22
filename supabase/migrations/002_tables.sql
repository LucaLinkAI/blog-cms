-- Migration 002: Tables
-- Creates all application tables with columns, constraints, FK references, and indexes.

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text        NOT NULL,
  avatar_url   text,
  bio          text,
  role         user_role   NOT NULL DEFAULT 'author',
  slug         text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX profiles_slug_idx ON profiles (slug);

-- ============================================================
-- categories
-- ============================================================
CREATE TABLE categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL,
  description text,
  color       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX categories_slug_idx ON categories (slug);
CREATE UNIQUE INDEX categories_name_idx ON categories (name);

-- ============================================================
-- tags
-- ============================================================
CREATE TABLE tags (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tags_slug_idx ON tags (slug);
CREATE UNIQUE INDEX tags_name_idx ON tags (name);

-- ============================================================
-- posts
-- ============================================================
CREATE TABLE posts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  slug             text        NOT NULL,
  content          jsonb,
  excerpt          text,
  cover_image_url  text,
  author_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id      uuid        REFERENCES categories(id) ON DELETE SET NULL,
  status           post_status NOT NULL DEFAULT 'draft',
  published_at     timestamptz,
  meta_title       text,
  meta_description text,
  reading_time     integer,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX posts_slug_idx              ON posts (slug);
CREATE        INDEX posts_author_idx            ON posts (author_id);
CREATE        INDEX posts_category_idx          ON posts (category_id);
CREATE        INDEX posts_status_published_at_idx ON posts (status, published_at DESC);
CREATE        INDEX posts_search_idx            ON posts
  USING GIN (to_tsvector('english', title || ' ' || coalesce(excerpt, '')));

-- ============================================================
-- post_tags  (junction table)
-- ============================================================
CREATE TABLE post_tags (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX post_tags_tag_idx ON post_tags (tag_id);

-- ============================================================
-- media
-- ============================================================
CREATE TABLE media (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename     text        NOT NULL,
  storage_path text        NOT NULL,
  url          text        NOT NULL,
  mime_type    text        NOT NULL,
  size_bytes   integer     NOT NULL,
  alt_text     text,
  uploaded_by  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX media_uploader_idx ON media (uploaded_by);
