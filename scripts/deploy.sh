#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# deploy.sh — Deploy blog-cms to Vercel
#
# Usage:
#   ./scripts/deploy.sh           # preview deployment
#   ./scripts/deploy.sh --prod    # production deployment
#
# Reads env vars from .env.vercel and syncs them to Vercel before deploying.
# -----------------------------------------------------------------------------

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
SCOPE="kktts-projects-d17766c2"
PROJECT="blog-cms"
ENV_FILE=".env.vercel"
ENVIRONMENTS=("production" "preview")

# ── Colours ───────────────────────────────────────────────────────────────────
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${BOLD}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}✔ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
err()  { echo -e "${RED}✖ $*${NC}" >&2; }

# ── Flags ─────────────────────────────────────────────────────────────────────
PROD=false
for arg in "$@"; do
  case $arg in
    --prod) PROD=true ;;
    --help|-h)
      echo "Usage: $0 [--prod]"
      echo "  --prod   Deploy to production (default: preview)"
      exit 0
      ;;
  esac
done

# ── 1. Check Vercel CLI ───────────────────────────────────────────────────────
if ! command -v vercel &>/dev/null; then
  err "vercel CLI not found. Install it with:  npm i -g vercel"
  exit 1
fi
ok "vercel CLI found ($(vercel --version 2>&1 | head -1))"

# ── 2. Link project ───────────────────────────────────────────────────────────
if [ ! -f ".vercel/project.json" ]; then
  log "Linking project to Vercel..."
  vercel link --scope "$SCOPE" --project "$PROJECT" --yes
  ok "Project linked"
else
  ok "Project already linked ($(cat .vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4))"
fi

# ── 3. Sync env vars from .env.vercel ─────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  warn "$ENV_FILE not found — skipping env var sync"
else
  log "Syncing env vars from $ENV_FILE to Vercel..."

  while IFS= read -r line; do
    # Skip blank lines and comments
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

    # Parse KEY=VALUE
    KEY="${line%%=*}"
    VALUE="${line#*=}"

    # Strip surrounding double-quotes
    VALUE="${VALUE%\"}"
    VALUE="${VALUE#\"}"

    for ENV in "${ENVIRONMENTS[@]}"; do
      # Remove existing var silently, then re-add with latest value
      vercel env rm "$KEY" "$ENV" --yes 2>/dev/null || true
      printf '%s' "$VALUE" | vercel env add "$KEY" "$ENV" 2>&1 \
        | grep -v "^Vercel CLI" | grep -v "^WARN" | grep -v "^Retrieving" \
        | grep -v "^Common" | grep -v "^\-" || true
    done

    ok "  $KEY → production, preview"
  done < "$ENV_FILE"
fi

# ── 4. Deploy ─────────────────────────────────────────────────────────────────
if $PROD; then
  log "Deploying to production..."
  vercel deploy --prod
else
  log "Deploying preview..."
  vercel deploy
fi
