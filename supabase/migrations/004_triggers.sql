-- Migration 004: Triggers
-- Creates triggers for:
--   1. handle_new_user()     — auto-creates a profiles row on auth.users INSERT
--   2. set_updated_at()      — keeps posts.updated_at current on every UPDATE
--   3. enforce_post_status_transition() — enforces the FR-013 status matrix

-- ============================================================
-- 1. handle_new_user  — fires AFTER INSERT on auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter   int := 0;
BEGIN
  -- Derive slug from email local part (before the @), then slugify
  base_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF length(base_slug) < 3 THEN
    base_slug := 'user-' || base_slug;
  END IF;

  final_slug := base_slug;

  -- Ensure uniqueness by appending a counter
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug);
    counter    := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  INSERT INTO public.profiles (id, display_name, role, slug)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    'author',
    final_slug
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. set_updated_at  — fires BEFORE UPDATE on posts
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3. enforce_post_status_transition  — fires BEFORE UPDATE OF status ON posts
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_post_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role user_role;
  old_status post_status;
  new_status post_status;
BEGIN
  -- Only run when status is actually changing
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT role INTO actor_role
  FROM public.profiles
  WHERE id = auth.uid();

  old_status := OLD.status;
  new_status := NEW.status;

  -- Rule 1: archived → published is NEVER allowed (FR-013)
  IF old_status = 'archived' AND new_status = 'published' THEN
    RAISE EXCEPTION
      'Cannot transition post directly from archived to published. '
      'Restore to draft first.';
  END IF;

  -- Rule 2: Only admin/editor can archive or un-archive (archived → draft)
  IF new_status = 'archived' OR old_status = 'archived' THEN
    IF actor_role NOT IN ('admin', 'editor') THEN
      RAISE EXCEPTION
        'Only admins and editors can archive or restore posts.';
    END IF;
  END IF;

  -- Rule 3: Author can only change status on own post (belt-and-suspenders; RLS handles row ownership)
  IF actor_role = 'author' AND NEW.author_id != auth.uid() THEN
    RAISE EXCEPTION
      'Authors can only change the status of their own posts.';
  END IF;

  -- Auto-set published_at when transitioning to published
  IF new_status = 'published' AND old_status != 'published' THEN
    NEW.published_at := now();
  END IF;

  -- Clear published_at when unpublishing
  IF old_status = 'published' AND new_status != 'published' THEN
    NEW.published_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER posts_status_transition_check
  BEFORE UPDATE OF status ON posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_post_status_transition();
