#!/usr/bin/env sh

set -eu

if [ -z "${SUPABASE_PROJECT_ID:-}" ]; then
  echo "SUPABASE_PROJECT_ID is required (target project ref)." >&2
  exit 2
fi

supabase link --project-ref "$SUPABASE_PROJECT_ID"
echo "Linked to project: $SUPABASE_PROJECT_ID"
