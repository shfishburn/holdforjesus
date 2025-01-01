#!/usr/bin/env sh

set -eu

if [ -z "${SUPABASE_PROJECT_ID:-}" ]; then
  echo "SUPABASE_PROJECT_ID is required." >&2
  exit 2
fi

sh scripts/supabase-link.sh
supabase db push

echo "Migrations pushed to project: $SUPABASE_PROJECT_ID"
