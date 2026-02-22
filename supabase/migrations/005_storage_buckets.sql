-- Migration 005: Storage Buckets
-- Creates the three Supabase Storage buckets and their RLS policies.
-- All three buckets are public (files accessible via public URL without auth).

-- ============================================================
-- Buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'post-covers',
    'post-covers',
    true,
    5242880,  -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'post-content',
    'post-content',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152,  -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage object RLS policies
-- ============================================================

-- Authenticated users can upload to any of the three buckets
CREATE POLICY "storage_insert_authenticated"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('post-covers', 'post-content', 'avatars'));

-- Authenticated users can view / download any object in the three buckets
CREATE POLICY "storage_select_authenticated"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id IN ('post-covers', 'post-content', 'avatars'));

-- Anonymous users can read public objects (images embedded in public posts)
CREATE POLICY "storage_select_anon"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id IN ('post-covers', 'post-content', 'avatars'));

-- Authenticated users can update their own objects
CREATE POLICY "storage_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (owner = auth.uid())
  WITH CHECK (owner = auth.uid());

-- Authenticated users can delete their own objects; admins can delete any
CREATE POLICY "storage_delete_own_or_admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    owner = auth.uid()
    OR public.get_my_role() = 'admin'
  );
