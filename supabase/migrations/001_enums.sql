-- Migration 001: Enums
-- Creates the user_role and post_status custom enum types.

CREATE TYPE user_role   AS ENUM ('admin', 'editor', 'author');
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
