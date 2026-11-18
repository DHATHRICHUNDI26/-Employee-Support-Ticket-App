# Employee Support Ticket App

A small internal demo app where employees raise IT support tickets and support staff manage them. Built as an AI-assisted lab project: spec first, approved plan, one commit per working step, manual checks, a prompt-driven feature, a defect cycle, tests, and a review.

## Run it

Requires Node.js 24+.

```powershell
npm install
npm start
```

Open <http://localhost:3000>. The SQLite database is created and seeded with the five sample tickets on first run. `npm test` runs 12 automated integration tests against in-memory databases.

## Demo users

| Name | Role | What they can do |
| --- | --- | --- |
| Ravi | Employee | See/edit own non-Closed tickets, comment |
| Priya | Employee | See/edit own non-Closed tickets, comment |
| Sam | Support staff | See all tickets, change status, comment |

Pick a user on the sign-in page. No password is needed (see known gaps).

## Features

- Create tickets with required title (max 100 chars), description, category and priority; status starts at `Open` and author/date fields are filled automatically.
- List with status/category/priority filters and text search; employees see only their own tickets, support staff see all.
- Ticket detail with comments and a visible last-updated time.
- Edit title/description/category/priority — creator only, and never on a `Closed` ticket.
- Support-only status workflow: `Open -> In Progress -> Resolved -> Closed` (forward only).
- Comments for any user who can see the ticket, including on `Closed` tickets.

## What AI generated

- The initial product prompt structure, the first draft of `docs/spec.md`, and the implementation plan in `docs/plan.md`.
- The full application scaffold: schema/seed data, Express routes, server-rendered views, styling, and the comments feature endpoint/validation from the prompt in `docs/prompts.md`.
- The automated test suite and the review/check documentation structure.

## What I changed

- Approved the plan before any application code was written.
- Edited the spec before build: support staff were changed to status-only (F5 now matches the permissions table), comments were made to refresh `updated_at`, and a 2000-char comment limit was added.
- Recorded manual checks in `docs/check-log.md`, including defect D-1 (same-day changes were invisible) and D-2 (comment form before its endpoint).
- Fixed D-1 by adding `formatDateTime()` and using it for last-updated values; documented reproduction and re-test in `docs/defect-log.md`.
- Adjusted one test assertion after discovering the seeded ticket #5 timestamp is later than the lab machine's current clock.
- Wrote the review in `docs/review.md` and this README.

## What I checked

- Browser walkthrough as Ravi and Sam: sign-in/out, visibility rules, filters, create, edit, Closed-ticket lock, status change, comment on a Closed ticket.
- HTTP checks for 400/401/403/404 responses, empty/overlong fields, trimming, XSS escaping, and `updated_at` refresh.
- `npm test`: 12 tests, 12 passing, 0 failing.
- Review of input checks, secrets/cookies, error handling and file structure.

## Known gaps

- Demo sign-in has no password — not real authentication; do not deploy as-is.
- No CSRF protection, rate limiting, HTTPS setup, or server-side session pruning.
- No notifications, attachments, assignment, audit log, pagination, reopen action, or deployment config.
- Status is forward-only by design; support staff cannot edit ticket text.

## Project layout

See `docs/review.md` for the file-structure review and `docs/plan.md` for the commit-by-commit build plan.
