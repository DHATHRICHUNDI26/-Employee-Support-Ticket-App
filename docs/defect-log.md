# Defect Log

## D-1 — Same-day updates were invisible in the UI

**Found:** manual Check phase (see `docs/check-log.md`). Created ticket #6 and edited its title, but both the list and detail page showed `Last updated: 18 Nov 2026`.

**Expected:** a change to a ticket should be visible to the user through the last-updated value.

**Actual:** `formatDate()` in `src/views.js` formatted only day/month/year, so two different `updated_at` timestamps on the same day rendered identically.

### Reproduction
In-memory app, signed in as Ravi, ticket #1:

```
GET /tickets/1                -> Last updated: 18 Nov 2026
POST /tickets/1/edit (new title/description)
GET /tickets/1                -> Last updated: 18 Nov 2026
DB updated_at                 -> 2026-11-18T09:00:00.000Z -> 2026-11-18T09:21:01.295Z
```

The database clearly changed while the display did not.

### Fix
Added `formatDateTime()` (date + `HH:mm UTC`) in `src/views.js` and used it for the `Last updated` value on the list and detail pages. Created dates remain date-only, matching the sample data.

### Re-test
Same reproduction script after the fix:

```
Displayed before: 18 Nov 2026, 09:00 UTC
Displayed after:  18 Nov 2026, 09:21 UTC
Visible change:   true
```

Also confirmed the list column shows the time. A permanent regression test is added in the Tests step.

## D-2 — Comment form rendered before its endpoint existed

Found during step 4 and resolved by the step 5 comments commit; re-tested in `docs/check-log.md`. Not a production defect after step 5.
