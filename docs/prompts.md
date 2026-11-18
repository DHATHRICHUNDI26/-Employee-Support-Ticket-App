# Prompts used in this lab

## Product prompt (pre-code)
The full problem/users/features/limits and fictional sample data are in `docs/product-prompt.md`. Key instruction: "Build a small app where employees raise support tickets and support staff update them... Only support staff can change status; employees see only their own tickets; a Closed ticket can't be edited but comments can still be added; title and description can't be empty."

## Spec and plan prompts
- "Draft a detailed spec from the product prompt, including users, data model, permissions, status workflow, validation and acceptance criteria."
- "Give me a step-by-step implementation plan with a commit after each working step; do not write application code until I approve the plan."

## New feature prompt — comments
> Add comments to tickets in the existing app. A comment stores ticket id, author, body (required, 1–2000 characters after trimming) and created timestamp. Any signed-in user who is allowed to see a ticket may add a comment, including on a Closed ticket. Show existing comments on the ticket detail page with author and date, and show a comment form there. Reject empty or too-long comments with a friendly 400 error and keep the entered text. Adding a comment must refresh the ticket's last-updated date. Do not allow commenting on a ticket the user cannot view. Use prepared SQL statements and escape all rendered text. Keep changes small and consistent with the current file structure.

The schema, seeded sample comments, detail-page comment list/form and error plumbing were already present from the initial generation; this prompt drove the final endpoint and validation wiring.
