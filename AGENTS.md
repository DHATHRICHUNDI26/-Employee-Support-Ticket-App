# AGENTS.md — Guidance for AI agents

## Project

Employee Support Ticket App: a small internal demo where employees raise IT tickets and support staff manage them. Built as an AI-assisted lab project, so the process artifacts (`docs/`) matter as much as the code.

Stack: Node.js 24+, Express 5, built-in `node:sqlite`, server-rendered HTML with vanilla CSS/JS, `node:test`. No frontend build step.

## Commands

```powershell
npm install          # install the single dependency (express)
npm start            # run at http://localhost:3000
npm test             # 12 integration tests against in-memory SQLite
```

## File layout

- `src/db.js` — schema, enums, seed data, `createDatabase(filename)`. Use `':memory:'` in tests.
- `src/app.js` — `createApp(db)`; all routes, session handling, validation and authorization.
- `src/views.js` — HTML rendering and escaping (`escapeHtml`, `formatDate`, `formatDateTime`).
- `src/server.js` — boot only.
- `public/` — static CSS and a tiny submit-confirm script.
- `tests/app.test.js` — `node:test` integration suite.
- `docs/` — product prompt, spec, plan, prompts, check/defect/review logs.
- `data/tickets.db` — runtime database, gitignored, seeded on first run.

## Rules to preserve

1. Only support staff may change status; transitions are forward-only: `Open → In Progress → Resolved → Closed`.
2. Employees see only tickets they created; support staff see all.
3. A `Closed` ticket cannot be edited, but comments are still allowed.
4. Title: required, trimmed, max 100 chars. Description: required, trimmed. Comment: trimmed, 1–2000 chars.
5. Every create/edit/status change/comment refreshes `updated_at`.
6. Display `updated_at` with time (`formatDateTime`); a date-only display was a real defect (D-1, see `docs/defect-log.md`).

## Implementation conventions

- All authorization decisions are made on the server from the session user — never trust hidden form fields or client-side role hints.
- Use prepared SQL statements with bound parameters; whitelist enum values instead of interpolating query input.
- Escape every dynamic value with `escapeHtml()` before rendering.
- Validation failures return 400 with a friendly page; unauthenticated 401, forbidden 403, missing 404, unexpected 500. Details are logged server-side, never shown to users.
- Sessions are random 32-byte tokens in an HttpOnly, SameSite=Lax cookie (`Secure` when `NODE_ENV=production`). No passwords or secrets in source.
- Keep files in their existing roles; do not mix database, routing, and rendering concerns.

## Workflow for changes

- For product-level changes, update `docs/product-prompt.md`, then `docs/spec.md`, then get plan approval before writing code.
- Record prompts used for generated features in `docs/prompts.md`.
- Make one working change per commit with a conventional prefix (`feat:`, `fix:`, `test:`, `docs:`).
- Verify new behaviour manually where practical and add `node:test` coverage; update `docs/check-log.md`, `docs/defect-log.md`, and `README.md` when relevant.
- Never commit `node_modules/`, `data/*.db`, or secrets.
- Known limitations are intentional for this lab; see `docs/review.md` and the README before adding production features.
