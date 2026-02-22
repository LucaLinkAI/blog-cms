#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# db-seed.sh — Run the TypeScript seed script (supabase/seed.ts).
#
# Usage:
#   pnpm db:seed
#   ./scripts/db-seed.sh
#
# Requires:
#   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local
#   - npx available (Node.js 18+)
# ---------------------------------------------------------------------------
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── Load .env.local ──────────────────────────────────────────────────────────
if [ -f "$REPO_ROOT/.env.local" ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env.local"
  set +o allexport
fi

# ── Validate ─────────────────────────────────────────────────────────────────
if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SECRET_KEY:-}" ]; then
  echo "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local"
  exit 1
fi

# ── Run seed ─────────────────────────────────────────────────────────────────
echo "Running seed script …"
echo ""

cd "$REPO_ROOT"
npx tsx supabase/seed.ts

echo ""
echo "Seed complete."
