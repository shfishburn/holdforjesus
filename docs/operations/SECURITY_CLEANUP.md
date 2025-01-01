# Security Cleanup Checklist

This repository previously tracked `.env`. Use this checklist to rotate exposed credentials and purge history.

## 1) Rotate credentials immediately

Rotate in Supabase (both source and target projects):
- Publishable/anon key
- Service role key
- Database password

Rotate in Vercel:
- Any Supabase-related environment variables that used old values
- Redeploy after updating env vars

## 2) Keep secrets out of git

Already configured:
- `.env` and `.env.*` are ignored
- `.env.example` remains tracked

Commit the staged `.env` removal so HEAD no longer tracks it.

## 3) Purge `.env` from git history

Run this from a fresh clone of the repo (recommended), then force-push.

Requirements:
- `git-filter-repo` installed (`brew install git-filter-repo`)

Commands:

```bash
# In a fresh clone
./scripts/security-purge-history.sh

# Push rewritten history
git push origin --force --all
git push origin --force --tags
```

## 4) Verify cleanup

```bash
# Should print nothing
git log -- .env

# Should not find leaked key material in tracked files
git grep -n -E 'postgresql://postgres:|sb_publishable_|SUPABASE_SERVICE_ROLE_KEY|TARGET_SUPABASE_SERVICE_ROLE_KEY|eyJhbGciOiJIUzI1Ni'
```

## 5) Post-purge coordination

- Inform collaborators to re-clone or hard reset to rewritten history.
- Revoke old local clones/caches if they contain leaked credentials.
