# Contributing to Hold for Jesus

Thanks for your interest in contributing. This project blends satire with real AI harm data and crisis resources, so contributions should respect that balance.

## Getting started

1. Fork the repo and clone your fork
2. Install dependencies: `npm install`
3. Create a branch: `git checkout -b my-feature`
4. Start the dev server: `npm run dev`
5. Make your changes
6. Run lint and tests: `npm run lint && npm test`
7. Commit and push
8. Open a pull request against `main`

## Development setup

See the [README](README.md#local-development) for environment setup. The app runs without Supabase credentials — static pages and UI work fully, only AI and live data features require a backend.

## What we're looking for

- **Bug fixes** — Something broken? Open a PR.
- **Accessibility improvements** — ARIA, keyboard nav, screen reader support.
- **Mobile responsiveness** — Layout fixes for small screens.
- **New faith traditions** — Adding a new hotline faith config (see `src/lib/faiths.ts`).
- **Incident data improvements** — Better categorization, new data sources, visualization ideas.
- **Performance** — Bundle size, loading speed, caching.
- **Tests** — More test coverage, especially for edge functions and middleware.

## Guidelines

### Code style

- **TypeScript** — All new code should be TypeScript with strict types.
- **Biome** — The project uses Biome for linting and formatting. Run `npm run lint:fix` before committing. The pre-commit hook handles this automatically.
- **Tailwind** — Use Tailwind utility classes. Avoid custom CSS unless necessary.
- **No dead code** — Don't leave commented-out code, unused imports, or placeholder files.

### Commit messages

Write clear, concise commit messages. Focus on *why*, not *what*:

```
fix: prevent stale prayer state on back navigation
feat: add Buddhist tradition with Dharma departments
```

### Pull requests

- Keep PRs focused — one feature or fix per PR.
- Include a brief description of what changed and why.
- If your PR touches AI responses or crisis detection, explain how you tested the safety behavior.

### Crisis resources and safety

This is non-negotiable:

- **Never weaken crisis detection.** If someone expresses distress, the system must surface real help.
- **Never remove or hide the 988 redirect.** It stays visible and functional.
- **Test edge cases.** If you touch the moderation pipeline, test with crisis language, trolling, and edge cases before submitting.

### Content tone

The project is satire, not mockery:

- Punch up, not down. The target is AI industry hubris, not people's faith.
- Every faith tradition should be treated with equal respect and equal absurdity.
- Real pain data (incidents, suffering index) should be presented factually, not sensationalized.

## Reporting issues

Open a GitHub issue with:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser/device if relevant

For security issues, email the maintainer directly rather than opening a public issue.

## Code of conduct

Be respectful. This project touches religion, mental health, and vulnerable populations. Engage thoughtfully. Harassment, hate speech, and bad-faith contributions will result in a ban.
