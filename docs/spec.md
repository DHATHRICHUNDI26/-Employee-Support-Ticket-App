# Specification — Employee Support Ticket App

## 1. Purpose
A small internal web app for employees to raise IT support tickets and for support staff to manage them. It replaces ad-hoc chat/spreadsheet tracking with one shared queue and a visible status workflow.

## 2. Scope
In scope: demo sign-in, ticket create/list/view/edit, role-based visibility, status workflow, comments, input validation, seeded sample data, automated tests, README.
Out of scope: production authentication, notifications, attachments, assignment, SLA reporting, multi-tenancy, deployments.

## 3. Users & permissions
| Action | Employee | Support staff |
| --- | --- | --- |
| Sign in as demo user | Yes | Yes |
| Create ticket | Yes | Yes |
| View own tickets | Yes | Yes |
| View all tickets | No | Yes |
| Edit own non-Closed ticket | Yes | Yes |
| Edit others' tickets | No | Yes (status only) |
| Change status | No | Yes |
| Comment on visible ticket | Yes | Yes |
| Comment on Closed ticket | Yes | Yes |

All authorization decisions are made on the server using the signed-in session user.

## 4. Data model
### User
- `id` (integer, PK)
- `username` (unique, lowercase)
- `display_name`
- `role`: `employee` | `support`

### Ticket
- `id` (integer, PK)
- `title` (required, 1-100 characters after trimming)
- `description` (required, non-empty after trimming)
- `category`: Hardware | Software | Network | Access | Other
- `priority`: Low | Medium | High
- `status`: Open | In Progress | Resolved | Closed
- `created_by` (user id, FK)
- `created_at` (ISO timestamp)
- `updated_at` (ISO timestamp)

### Comment
- `id` (integer, PK)
- `ticket_id` (FK)
- `author_id` (FK)
- `body` (required, 1-2000 characters after trimming)
- `created_at` (ISO timestamp)

### Session
- `token` (random, PK)
- `user_id` (FK)
- `created_at` (ISO timestamp)

## 5. Status workflow
`Open -> In Progress -> Resolved -> Closed`. Support staff may move a ticket to a later state only. A `Closed` ticket is read-only for title/description/category/priority; comments remain allowed. Creating a ticket sets `status = Open`.

## 6. Functional requirements
1. **F1 Sign in**: user selects a seeded demo user; server creates a session and sets an HttpOnly cookie. Sign out clears it.
2. **F2 Create**: signed-in user submits title, description, category, priority; server validates, stores author and timestamps, redirects to ticket detail.
3. **F3 List**: employees see only tickets they created; support staff see all. Optional filters by status/category/priority and text search.
4. **F4 Detail**: show all ticket fields, author name, timestamps, and comments newest last.
5. **F5 Edit**: the creator can edit title/description/category/priority unless status is `Closed`. Support staff change status only and cannot edit another user's fields. `updated_at` refreshes.
6. **F6 Status change**: only support staff can post a new status; invalid transitions are rejected. `updated_at` refreshes.
7. **F7 Comments**: any user who can see the ticket can add a comment, including on `Closed` tickets. `updated_at` refreshes.
8. **F8 Validation/errors**: empty/overlong fields, unknown enum values, missing tickets, and forbidden actions return a clear 4xx response and a friendly message in the UI.

## 7. Non-functional requirements
- Node.js 24 built-in `node:sqlite`; Express for HTTP; server-rendered HTML + small vanilla JS; no build step.
- Local `data/tickets.db` file, created and seeded on first run.
- No secrets in source: session tokens are random; no passwords are stored. Any future signing key must come from an environment variable.
- Input is escaped when rendered; prepared SQL statements for all queries.
- `node:test` unit/integration tests covering permissions, validation, workflow, comments, and Closed-ticket rules.

## 8. Acceptance criteria
- Seeded tickets 1-5 appear for the right users with the example values.
- Ravi cannot see Priya's tickets; Sam sees all.
- Ravi cannot change status; Sam can advance status.
- Empty title/description and title > 100 chars are rejected.
- Closed ticket edit returns an error; comment on Closed ticket succeeds.
- Every create/edit/status/comment updates `updated_at` where applicable.
- All automated tests pass.

## 9. Known limitations
Demo sign-in has no password, so it is not real authentication. No notifications, attachments, assignment, audit log, or deployment configuration.

---

### Draft-to-final edit notes
- Initial draft allowed support staff to edit any ticket field; changed to status-only to match rule 1 (F5 now matches the permissions table).
- Initial draft did not specify that comments refresh `updated_at`; added to F7 and acceptance criteria.
- Added explicit max length for comments (2000 chars) to bound input.
