# Copilot Workspace Instructions

## Project at a glance
- Frontend: React + TypeScript + Vite in `src/`
- Backend/data: Supabase Edge Functions in `supabase/functions/`
- Styling: Tailwind + shadcn/ui
- State: Zustand stores under `src/stores/`

## Runtime and deployment
- Production host: Vercel (SPA rewrite via `vercel.json`)
- Database: Supabase (self-managed project)
- Keep environment variables out of git-tracked files

## Coding guidance
- Prefer TypeScript strict-safe changes.
- Keep UI components in existing style/pattern conventions.
- For DB changes, add SQL migrations under `supabase/migrations/`.
- For function changes, validate with `npm run deno:lint`.
- For app changes, validate with `npm run build`.

## Data and safety
- Crisis-related behavior must preserve redirect/support flow to `/crisis` and 988 guidance.
- Never hardcode API keys, service role keys, or DB passwords in source files.

## Useful commands
- `npm run dev`
- `npm run build`
- `npm run deno:lint`
- `SUPABASE_PROJECT_ID="<ref>" npm run db:push`
- `npm run types:supabase`
