# AGENTS

This file gives coding agents a quick map of this repository.

## Repository map
- `src/`: React app pages, components, hooks, stores
- `src/integrations/supabase/`: client and generated DB types
- `supabase/functions/`: Deno Edge Functions
- `supabase/migrations/`: SQL migration history
- `public/llms.txt`: high-level product context for LLMs

## Operating rules
- Treat `.env` and secrets as local-only; never commit keys.
- Add schema changes through migrations, not ad-hoc SQL edits.
- Keep function auth assumptions explicit (`verify_jwt` and header checks).
- Preserve crisis safety handling and non-humorous crisis responses.

## Validation checklist
- Frontend/build: `npm run build`
- Edge function lint: `npm run deno:lint`
- Tests: `npm run test`

## Deployment notes
- Frontend deploy target: Vercel
- Backend target: Supabase project linked by `SUPABASE_PROJECT_ID`
- Regenerate types after schema updates: `npm run types:supabase`
