# Implementation Plan — Employee Support Ticket App

> Status: **Awaiting approval** — no application code will be written until this plan is approved.

## Proposed stack
- Node.js 24 + Express 5 (HTTP/routing, one dependency)
- `node:sqlite` built-in for storage (no native install)
- Server-rendered HTML pages with vanilla JS/CSS in `public/` (no frontend build)
- `node:test` for automated tests

## Steps (each step ends with a git commit)
0. **Docs & repo**: initialise Git, write product prompt, spec, this plan. Commit `docs: add product prompt, spec and plan`.
1. **Scaffold**: `package.json`, `.gitignore`, `src/db.js` (schema + seed sample data), `src/server.js` (Express app, static files, health route), basic layout/CSS. Commit `feat: scaffold app, database schema and seed data`.
2. **Auth & tickets**: demo sign-in/out with server-side session cookie; ticket list/detail/create/edit with validation and role-based visibility. Commit `feat: add demo sign-in and ticket management`.
3. **Workflow**: status change endpoint restricted to support staff with forward-only transitions; Closed ticket edit lock; "last updated" refresh. Commit `feat: add support-only status workflow and closed-ticket lock`.
4. **Check manually**: run the app, exercise every feature, record defects in `docs/check-log.md`. Commit log.
5. **New feature — comments**: migration-safe `comments` table, comment UI on detail page, validation, permission checks, comments allowed on Closed tickets. Commit `feat: add ticket comments`.
6. **Fix a defect**: reproduce a defect found in step 4/5, add a regression test or script evidence, fix it, re-test, document in `docs/defect-log.md`. Commit `fix: <defect>`.
7. **Tests**: `node:test` suite for validation, permissions, workflow, comments, Closed rules; run `npm test`. Commit `test: add automated coverage`.
8. **Review & README**: check input validation, secrets/error handling, file structure; write README describing AI output, human edits, checks, and known gaps. Commit `docs: add review notes and README`.

## Verification per step
- `npm start` serves the app on `http://localhost:3000`.
- `npm test` passes after steps 7-8.
- Manual checklist in `docs/check-log.md` covers each acceptance criterion.
