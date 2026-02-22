-- Migration 003: Row-Level Security (RLS)
-- Enables RLS on all tables and creates all access policies.
-- Role lookup uses the get_my_role() SECURITY DEFINER helper to avoid circular RLS.

-- ============================================================
-- Helper function: get_my_role()
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE media     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- categories: public read, authenticated write (admin/editor)
-- ============================================================
CREATE POLICY "categories_select_all"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "categories_write_admin_editor"
  ON categories FOR ALL
  TO authenticated
  USING  (public.get_my_role() IN ('admin', 'editor'))
  WITH CHECK (public.get_my_role() IN ('admin', 'editor'));

-- ============================================================
-- tags: public read, authenticated write
-- ============================================================
CREATE POLICY "tags_select_all"
  ON tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "tags_write_admin_editor"
  ON tags FOR ALL
  TO authenticated
  USING  (public.get_my_role() IN ('admin', 'editor'))
  WITH CHECK (public.get_my_role() IN ('admin', 'editor'));

-- ============================================================
-- post_tags: public read, inherit from posts access
-- ============================================================
CREATE POLICY "post_tags_select_all"
  ON post_tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "post_tags_write_authenticated"
  ON post_tags FOR ALL
  TO authenticated
  USING  (true)
  WITH CHECK (true);

-- ============================================================
-- profiles: SELECT
-- ============================================================

-- Public read (needed for author pages)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- profiles: UPDATE
-- ============================================================

-- Admin can update any profile (including role changes)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING  (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Author can update own profile (cannot escalate role)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    AND public.get_my_role() = 'author'
  )
  WITH CHECK (
    id = auth.uid()
    AND public.get_my_role() = 'author'
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- profiles: DELETE
-- ============================================================
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- posts: SELECT
-- ============================================================

-- Unauthenticated: published only
CREATE POLICY "posts_select_public"
  ON posts FOR SELECT
  TO anon
  USING (status = 'published');

-- Admin and Editor: all posts
CREATE POLICY "posts_select_admin_editor"
  ON posts FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'editor'));

-- Author: own posts only
CREATE POLICY "posts_select_author"
  ON posts FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'author'
    AND author_id = auth.uid()
  );

-- ============================================================
-- posts: INSERT
-- ============================================================
CREATE POLICY "posts_insert_authenticated"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN ('admin', 'editor')
    OR
    (public.get_my_role() = 'author' AND author_id = auth.uid())
  );

-- ============================================================
-- posts: UPDATE
-- ============================================================
CREATE POLICY "posts_update_admin"
  ON posts FOR UPDATE
  TO authenticated
  USING  (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "posts_update_editor"
  ON posts FOR UPDATE
  TO authenticated
  USING  (public.get_my_role() = 'editor')
  WITH CHECK (public.get_my_role() = 'editor');

CREATE POLICY "posts_update_author"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'author'
    AND author_id = auth.uid()
  )
  WITH CHECK (
    public.get_my_role() = 'author'
    AND author_id = auth.uid()
  );

-- ============================================================
-- posts: DELETE
-- ============================================================
CREATE POLICY "posts_delete_admin"
  ON posts FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE POLICY "posts_delete_editor"
  ON posts FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'editor');

CREATE POLICY "posts_delete_author"
  ON posts FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() = 'author'
    AND author_id = auth.uid()
  );

-- ============================================================
-- media: SELECT
-- ============================================================
CREATE POLICY "media_select_authenticated"
  ON media FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- media: INSERT
-- ============================================================
CREATE POLICY "media_insert_authenticated"
  ON media FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- ============================================================
-- media: UPDATE
-- ============================================================
CREATE POLICY "media_update_admin_editor"
  ON media FOR UPDATE
  TO authenticated
  USING  (public.get_my_role() IN ('admin', 'editor'))
  WITH CHECK (public.get_my_role() IN ('admin', 'editor'));

CREATE POLICY "media_update_own"
  ON media FOR UPDATE
  TO authenticated
  USING  (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- ============================================================
-- media: DELETE
-- ============================================================
CREATE POLICY "media_delete_admin"
  ON media FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');
