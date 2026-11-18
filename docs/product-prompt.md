# Product Prompt — Employee Support Ticket App

## Problem
Employees need a simple way to report workplace IT problems and follow their progress. Support staff need a single place to see every request and move it through a clear workflow. Today this happens in scattered chat messages and spreadsheets, so status is hard to see and details get lost.

## Users
- **Employee** — submits tickets, sees only their own tickets, can add comments to their own tickets (including Closed ones).
- **Support staff** — sees all tickets, changes ticket status, can add comments.

## Features
1. **Sign in** — pick a demo user (employee or support staff) so the app can enforce role rules on the server.
2. **Create ticket** — title (required, <= 100 chars), description (required), category (Hardware / Software / Network / Access / Other), priority (Low / Medium / High). Status starts as `Open`, created by and created/updated dates are filled automatically.
3. **List tickets** — employees see only their own; support staff see all. Filter/sort by status, category, priority.
4. **View ticket** — all stored details plus comment history.
5. **Edit ticket** — the employee who created it may edit title, description, category and priority. A **Closed** ticket cannot be edited.
6. **Change status** — support staff only; `Open -> In Progress -> Resolved -> Closed`.
7. **Comments** — any signed-in user with access to a ticket can add a comment. Closed tickets still accept comments. Every change refreshes the last-updated date.
8. **Validation & errors** — reject empty titles/descriptions, overlong titles, unknown categories/priorities/statuses, and unauthorized actions with clear messages.

## Limits / Non-goals
- Internal demo app with fictional people and data; no email/SMS notifications.
- No passwords or real authentication: identity is chosen from a seeded demo-user list (server-side session cookie). Not for production.
- No file attachments, no SLA timers, no assignment to individual support engineers, no admin user management.
- Single local SQLite database; no multi-tenant separation.
- Status only moves forward through the four states.

## Sample data (fictional, safe for AI tools)

### Demo users
| Name | Role |
| --- | --- |
| Ravi | Employee |
| Priya | Employee |
| Sam | Support staff |

### Ticket details
| Detail | Example | Who fills it |
| --- | --- | --- |
| Title (required, up to 100 chars) | Laptop not charging | Employee |
| Description (required) | My laptop shows 0% even when plugged in | Employee |
| Category | Hardware | Employee picks from a list |
| Priority | High | Employee picks from a list |
| Status (Open -> In Progress -> Resolved -> Closed) | Open | App sets it; support staff changes it |
| Created by | Ravi | App fills automatically |
| Created date | 18 Nov 2026 | App fills automatically |
| Last updated date | 18 Nov 2026 | App updates on every change |

### Sample tickets
| # | Title | Category | Priority | Status | Author |
| --- | --- | --- | --- | --- | --- |
| 1 | Laptop not charging | Hardware | High | Open | Ravi |
| 2 | Cannot log in to VPN | Network | High | In Progress | Ravi |
| 3 | Need access to the shared project folder | Access | Medium | Open | Priya |
| 4 | Excel keeps crashing on startup | Software | Medium | Resolved | Priya |
| 5 | Request a second monitor | Hardware | Low | Closed | Ravi |

## Rules to enforce
1. Only support staff can change a ticket's status.
2. An employee sees only their own tickets; support staff see all tickets.
3. A Closed ticket can't be edited, but comments can still be added.
4. Title and description can't be empty.
