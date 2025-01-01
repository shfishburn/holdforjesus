#!/usr/bin/env sh

set -eu

if [ -z "${SOURCE_DB_URL:-}" ]; then
  echo "SOURCE_DB_URL is required." >&2
  exit 2
fi

if [ -z "${TARGET_DB_URL:-}" ]; then
  echo "TARGET_DB_URL is required." >&2
  exit 2
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is required. Install PostgreSQL client tools first." >&2
  exit 3
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required. Install PostgreSQL client tools first." >&2
  exit 3
fi

# Schema migrations should be applied first via `npm run db:push`.
# This script copies data only, excluding ownership/ACL metadata.
pg_dump \
  --data-only \
  --no-owner \
  --no-privileges \
  --quote-all-identifiers \
  "$SOURCE_DB_URL" | psql "$TARGET_DB_URL"

echo "Data copy completed (source -> target)."
