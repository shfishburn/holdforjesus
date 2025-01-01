#!/usr/bin/env sh

set -eu

OUT_FILE="src/integrations/supabase/types.ts"
SCHEMA="${SUPABASE_SCHEMA:-public}"
PROJECT_ID="${SUPABASE_PROJECT_ID:-}"

tmp_file="$(mktemp)"
cleanup() {
  rm -f "$tmp_file"
}
trap cleanup EXIT INT TERM

echo "[types] trying local Supabase..."
if supabase gen types typescript --local --schema "$SCHEMA" >"$tmp_file" 2>/tmp/supabase-types-local.log; then
  mv "$tmp_file" "$OUT_FILE"
  echo "[types] generated from local Supabase"
  exit 0
fi

if [ -n "${SUPABASE_DB_URL:-}" ]; then
  echo "[types] local failed; trying SUPABASE_DB_URL..."
  if supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema "$SCHEMA" >"$tmp_file" 2>/tmp/supabase-types-dburl.log; then
    mv "$tmp_file" "$OUT_FILE"
    echo "[types] generated from SUPABASE_DB_URL"
    exit 0
  fi
else
  echo "[types] local failed; SUPABASE_DB_URL not set, skipping db-url"
fi

if [ -n "$PROJECT_ID" ]; then
  echo "[types] db-url unavailable/failed; trying project-id $PROJECT_ID..."
  if supabase gen types typescript --project-id "$PROJECT_ID" --schema "$SCHEMA" >"$tmp_file" 2>/tmp/supabase-types-project.log; then
    mv "$tmp_file" "$OUT_FILE"
    echo "[types] generated from project-id $PROJECT_ID"
    exit 0
  fi
else
  echo "[types] db-url unavailable/failed; SUPABASE_PROJECT_ID not set, skipping project-id"
fi

echo "[types] generation failed for all methods (local -> dburl -> project)" >&2
echo "[types] check logs: /tmp/supabase-types-local.log /tmp/supabase-types-dburl.log /tmp/supabase-types-project.log" >&2
exit 1
