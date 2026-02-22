#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# db-migrate.sh — Apply all SQL migrations via the Supabase CLI.
#
# Usage:
#   pnpm db:migrate
#   ./scripts/db-migrate.sh
#
# One-time setup (run these manually before using this script):
#   brew install supabase/tap/supabase
#   supabase login
#   supabase link --project-ref <your-project-ref>
#
# The project-ref is the ID in your dashboard URL:
#   https://supabase.com/dashboard/project/<project-ref>
#
# Applies all files in supabase/migrations/ in filename order.
# ---------------------------------------------------------------------------
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── Check Supabase CLI is installed ──────────────────────────────────────────
if ! command -v supabase &>/dev/null; then
  echo "ERROR: Supabase CLI is not installed."
  echo ""
  echo "  Install it with:"
  echo "    brew install supabase/tap/supabase"
  echo ""
  echo "  Then link your project (once):"
  echo "    supabase login"
  echo "    supabase link --project-ref <your-project-ref>"
  exit 1
fi

# ── Push migrations ──────────────────────────────────────────────────────────
echo "Pushing migrations to Supabase …"
echo ""

cd "$REPO_ROOT"
supabase db push

echo ""
echo "Migrations applied."
