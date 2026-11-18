# Manual Check Log — 18 Nov 2026

App started with `npm start` on `http://localhost:3000`; exercised through the in-app browser as Ravi (employee) and Sam (support staff). Database was left with one additional test ticket (#6) from the check.

| Check | How | Result |
| --- | --- | --- |
| Sign-in page | Opened `/signin` | Pass — three demo users listed with roles |
| Employee visibility | Signed in as Ravi | Pass — 3 own tickets; Priya's tickets absent |
| Support visibility | Signed in as Sam | Pass — all 6 tickets including Priya's and Ravi's |
| List filters | Status = Closed (combined with other filters) | Pass — 1 matching ticket shown |
| Create ticket | UI form: title, description, Software, High | Pass — redirected to `/tickets/6`, fields/author/dates correct, status Open |
| Edit ticket | Changed title on ticket #6 via UI | Pass — saved and detail updated |
| Closed ticket lock | Opened ticket #5 as Ravi | Pass — no Edit link, "cannot be edited" note shown |
| Status form visibility | Ticket #6 as Ravi | Pass — "Only support staff can change the status" |
| Status change | Ticket #6 as Sam, Open -> In Progress | Pass — status changed; next options are Resolved/Closed only |
| Permissions via HTTP | Ravi POST status, backward transition, Ravi POST edit on Closed | Pass — 403 / 400 / 403 respectively |
| Empty fields via HTTP | POST `/tickets` with blank title and description | Pass — 400 with error page |

## Defects found
1. **Last-updated change is not visible (D-1).** Created and then edited ticket #6, but both dates render as `18 Nov 2026` because `formatDate()` only shows day/month/year. The underlying `updated_at` value changes, but a user cannot see that a same-day change occurred. Fix planned: include the time (UTC) in the displayed last-updated value.
2. **Comment form present before its endpoint (D-2).** The detail page renders the comment form even though the comments feature is implemented in the next planned step. Not a runtime defect once step 5 lands; verify submission then.

## Comment feature re-check (after step 5)
| Check | How | Result |
| --- | --- | --- |
| Comment on Closed ticket | Ravi comments on ticket #5 in the browser | Pass — comment appears under Comments; closed note remains |
| Empty / overlong comment | HTTP POST with blank body and 2001 chars | Pass — 400 with friendly error |
| Unauthorized comment | Priya posts to Ravi's ticket | Pass — 403 |
| Trim & timestamp | HTTP POST with padded body | Pass — stored trimmed; ticket `updated_at` refreshed |
| Stale process | Page hit 502/404 because the server was started before the new route | Process issue only — restarted server, then all checks passed |

## Notes
- Browser automation produced one stale-ref click error and one filter form with extra query parameters; both were tooling artefacts, not app behaviour. Re-snapshotting and re-navigating gave correct results.
- No browser console errors were observed on the pages visited.
- D-2 is resolved by the comments endpoint; D-1 remains open for the defect-fix step.
