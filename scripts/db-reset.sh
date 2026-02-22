#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# db-reset.sh — Drop ALL application objects from the database.
#
# This removes every table, type, function, trigger, and storage policy
# created by the migrations. It does NOT touch auth.users (Supabase managed).
#
# Usage:
#   pnpm db:reset              (interactive — asks for confirmation)
#   pnpm db:reset --yes        (non-interactive — skips confirmation)
#   ./scripts/db-reset.sh --yes
#
# Requires:
#   - psql (PostgreSQL client)
#   - DATABASE_URL set in .env.local or the environment
# ---------------------------------------------------------------------------
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── Load .env.local ──────────────────────────────────────────────────────────
if [ -f "$REPO_ROOT/.env.local" ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$REPO_ROOT/.env.local")
  set +o allexport
fi

# ── Validate ─────────────────────────────────────────────────────────────────
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo ""
  echo "  Add it to .env.local:"
  echo "  DATABASE_URL=\"postgresql://postgres.<ref>:<password>@<host>:5432/postgres\""
  echo ""
  echo "  Find it in Supabase Dashboard → Settings → Database → Connection string (URI)"
  exit 1
fi

if ! command -v psql &>/dev/null; then
  echo "ERROR: psql is not installed."
  echo "  macOS:  brew install libpq && brew link --force libpq"
  echo "  Ubuntu: apt-get install postgresql-client"
  exit 1
fi

# ── Confirmation prompt ───────────────────────────────────────────────────────
SKIP_CONFIRM=false
for arg in "$@"; do
  if [ "$arg" = "--yes" ] || [ "$arg" = "-y" ]; then
    SKIP_CONFIRM=true
  fi
done

if [ "$SKIP_CONFIRM" = false ]; then
  echo "⚠️  WARNING: This will permanently delete ALL application data."
  echo "   Tables: post_tags, media, posts, tags, categories, profiles"
  echo "   Types:  user_role, post_status"
  echo "   Functions & triggers created by the migrations"
  echo "   Storage bucket policies for post-covers, post-content, avatars"
  echo ""
  read -r -p "Type 'reset' to confirm: " CONFIRM
  if [ "$CONFIRM" != "reset" ]; then
    echo "Aborted."
    exit 0
  fi
fi

# ── Execute cleanup SQL ───────────────────────────────────────────────────────
echo ""
echo "Resetting database …"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 << 'SQL'

-- ── Storage bucket policies ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "storage_delete_own_or_admin"  ON storage.objects;
DROP POLICY IF EXISTS "storage_update_own"            ON storage.objects;
DROP POLICY IF EXISTS "storage_select_anon"           ON storage.objects;
DROP POLICY IF EXISTS "storage_select_authenticated"  ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_authenticated"  ON storage.objects;

-- ── Triggers ────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created         ON auth.users;
DROP TRIGGER IF EXISTS posts_updated_at             ON posts;
DROP TRIGGER IF EXISTS posts_status_transition_check ON posts;

-- ── RLS policies — media ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "media_delete_admin"          ON media;
DROP POLICY IF EXISTS "media_update_own"            ON media;
DROP POLICY IF EXISTS "media_update_admin_editor"   ON media;
DROP POLICY IF EXISTS "media_insert_authenticated"  ON media;
DROP POLICY IF EXISTS "media_select_authenticated"  ON media;

-- ── RLS policies — posts ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "posts_delete_author"         ON posts;
DROP POLICY IF EXISTS "posts_delete_editor"         ON posts;
DROP POLICY IF EXISTS "posts_delete_admin"          ON posts;
DROP POLICY IF EXISTS "posts_update_author"         ON posts;
DROP POLICY IF EXISTS "posts_update_editor"         ON posts;
DROP POLICY IF EXISTS "posts_update_admin"          ON posts;
DROP POLICY IF EXISTS "posts_insert_authenticated"  ON posts;
DROP POLICY IF EXISTS "posts_select_author"         ON posts;
DROP POLICY IF EXISTS "posts_select_admin_editor"   ON posts;
DROP POLICY IF EXISTS "posts_select_public"         ON posts;

-- ── RLS policies — profiles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_delete_admin"       ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"         ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin"       ON profiles;
DROP POLICY IF EXISTS "profiles_select_public"      ON profiles;

-- ── RLS policies — categories / tags / post_tags ────────────────────────────
DROP POLICY IF EXISTS "categories_write_admin_editor" ON categories;
DROP POLICY IF EXISTS "categories_select_all"         ON categories;
DROP POLICY IF EXISTS "tags_write_admin_editor"       ON tags;
DROP POLICY IF EXISTS "tags_select_all"               ON tags;
DROP POLICY IF EXISTS "post_tags_write_authenticated"  ON post_tags;
DROP POLICY IF EXISTS "post_tags_select_all"           ON post_tags;

-- ── Tables (CASCADE drops FKs, indexes, and RLS automatically) ──────────────
DROP TABLE IF EXISTS post_tags  CASCADE;
DROP TABLE IF EXISTS media      CASCADE;
DROP TABLE IF EXISTS posts      CASCADE;
DROP TABLE IF EXISTS tags       CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles   CASCADE;

-- ── Functions ────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.enforce_post_status_transition();
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_my_role();

-- ── Enums ────────────────────────────────────────────────────────────────────
DROP TYPE IF EXISTS post_status CASCADE;
DROP TYPE IF EXISTS user_role   CASCADE;

SQL

echo ""
echo "Database reset complete."
