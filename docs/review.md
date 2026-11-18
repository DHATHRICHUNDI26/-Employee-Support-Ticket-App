# Review Notes

## Input checks — pass
- Title: trimmed, required, max 100 chars (client hint + server enforcement).
- Description: trimmed, required. Category/priority/status: enum checks on the server.
- Comment: trimmed, 1–2000 chars; empty or overlong submissions return 400 and keep the typed text.
- Record IDs go through `parseId()` (safe integer > 0); unknown IDs return 404.
- All SQL uses prepared statements with bound parameters; filter columns are whitelisted enums, not raw query text.
- Search text strips `%` and `_` before building `LIKE` patterns and is capped at 100 chars.
- All dynamic text in HTML is passed through `escapeHtml()`; XSS is covered by a test.

## Secrets — pass with documented limitation
- No passwords, API keys, tokens or connection strings are stored in source. `.gitignore` excludes local DB files and `node_modules`.
- Session IDs are 32 random bytes; only an opaque cookie is sent to the browser. Cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` when `NODE_ENV=production`.
- There are no external scripts, CDNs or telemetry calls.
- Limitation: the demo sign-in has no password, so it is not production authentication. Anyone who reaches the app can choose "Sam" and gain support permissions.

## Error handling — pass
- 400 for invalid input, 401 when signed out, 403 for forbidden actions, 404 for missing records/routes, 500 fallback.
- Errors render a friendly page with a link back; details are logged server-side only.
- Sign-out deletes the server-side session; a stale cookie then gets 401.

## File structure — pass
```
docs/       product prompt, spec, plan, prompts, check/defect/review logs
public/     styles.css, app.js (no build step)
src/        db.js (schema + seed), app.js (routes/rules), views.js (HTML), server.js (boot)
tests/      app.test.js (node:test integration tests)
data/       runtime SQLite file (gitignored)
```

## Gaps / recommendations (not fixed in this lab)
- No passwords/real identity, CSRF tokens, rate limiting or HTTPS termination.
- Sessions expire in the browser after 24 h but old rows are not pruned server-side.
- Status workflow is forward-only (no reopen); support staff cannot edit ticket text by design.
- No notifications, attachments, assignment, audit log, pagination, or deployment config.

**Conclusion:** no further code changes required for the lab's review scope.
