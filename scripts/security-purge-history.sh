#!/usr/bin/env sh

set -eu

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo is required. Install with: brew install git-filter-repo" >&2
  exit 2
fi

# Safety: history rewrite should be run from a clean working tree.
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit/stash changes first, then rerun." >&2
  exit 3
fi

echo "Rewriting history to remove .env from all commits..."
git filter-repo --path .env --invert-paths --force

echo "Done. Next: force-push rewritten history:"
echo "  git push origin --force --all"
echo "  git push origin --force --tags"
