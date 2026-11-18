# Specification — Leave Request and Approval

## 1. Purpose
Provide employees with a consistent way to request leave and managers with a clear way to review and decide requests, with auditable history and timely notifications.

## 2. Scope
**In scope:** Casual Leave (CL), Sick Leave (SL), half-day requests, balance checks, manager/backup approvals, cancellation of approved leave (before start date), notifications, and request history.

**Out of scope:** Payroll processing, balance carryover, production authentication/SSO integration details beyond role-based access, reporting/analytics, and any leave types not listed above.

## 3. Users and roles
| Role | Description | Key permissions |
| --- | --- | --- |
| Employee | Submits and tracks own leave requests | Request CL/SL/half-day, view own balances and history, cancel own approved leave before start date |
| Reporting manager | Primary approver for direct reports | View assigned requests, approve/reject with reason, receive notifications |
| HR-configured backup approver | Acts when primary manager is unavailable | Same review actions as manager for routed requests |
| HR | Policy/admin role | Configure approvers/holidays/policy inputs as needed, approve LOP for excess days; view/audit as permitted |

All authorization and routing decisions are enforced on the server based on the authenticated user and configured relationships.

## 4. User stories and acceptance criteria

### US-1: Request leave
- **AC-1 (CL sufficient balance, advance notice):** Given an employee has 5 CL days available, when they request 2 CL days at least 2 working days ahead, then the request is submitted and routed to their reporting manager for review.
- **AC-2 (Insufficient balance / LOP):** Given an employee has 1 SL day available, when they request 3 SL days, then the system shows the message **"Not enough leave balance"**. Any excess days beyond available paid balance are treated as Loss of Pay (LOP) and require HR approval before they can be granted/confirmed as paid/LOP per policy.

### US-2: Follow notice rules
- **AC-3 (CL notice):** CL requests require at least 2 working days’ notice relative to the leave start date.
- **AC-4 (SL notice window):** SL may be requested on the day of leave or within 2 working days after returning from leave.
- **AC-5 (Half-days):** Half-day requests are allowed for both CL and SL.

### US-3: Review a request
- **AC-6 (Decision timeliness):** The manager or backup approver can record a decision (approve/reject) on a pending request; the process target is a decision within 2 working days of submission/routing.
- **AC-7 (Backup routing):** If the reporting manager is on leave/unavailable per configuration, the request is routed to the configured backup approver.
- **AC-8 (Rejection reason and notification):** When a request is rejected, a reason is required, the decision is recorded, and the employee is notified.

### US-4: Cancel approved leave
- **AC-9 (Cancellation before start):** An employee may cancel an approved leave request before the leave start date; the manager is notified by email and the employee’s leave balance is adjusted accordingly.

## 5. Business rules and functional requirements

### 5.1 Leave entitlements and calendar
- **BR-1:** Each employee receives **12 CL days** and **8 SL days** per calendar year, credited on **1 January** (policy year = calendar year).
- **BR-2:** Working days are **Monday–Friday**, excluding configured company holidays. Day counts and notice periods are calculated in working days.
- **BR-3:** Paid leave cannot exceed the available balance for the relevant leave type/policy year. Excess days are LOP and require HR approval (see AC-2).

### 5.2 Validation (server-side)
- **FR-1:** Validate leave type (CL/SL), date range, start/end ordering, half-day indicator and placement details, requested day count, notice-period compliance (AC-3/AC-4), balance/LOP conditions (AC-2/BR-3), and that a valid approver/routing target exists (or surface an actionable error if not).
- **FR-2:** Reject invalid input with clear, user-friendly messages; do not expose internal error details to users.

### 5.3 Balances, status, and workflow
- **FR-3:** Display current balances (CL/SL) and request status/history to authorized users.
- **FR-4:** Route submitted requests to the correct approver (manager or backup per AC-7) and persist workflow state.
- **FR-5:** Record decisions, reasons, timestamps, cancellations, and an audit history of changes.
- **FR-6:** Enforce role-based access control so users can only view/act on requests they are authorized for.

### 5.4 Notifications
- **FR-7:** Send notifications for key events at minimum: request submitted/routed, request approved, request rejected (with reason), and approved leave cancelled (email manager per AC-9). Channel details (email/in-app) to be finalized, but email is required where stated.

## 6. Data to store (minimum)
- Employee ID and reporting/approver relationship identifiers (including backup approver configuration)
- Leave request: ID, employee ID, leave type (CL/SL), start/end dates, half-day flag/details, requested days, policy year
- Balance/accounting: available/used/pending balances per type and policy year; LOP days and HR-approval state where applicable
- Workflow: status, current/assigned approver, submission/decision/cancellation timestamps, decision (approve/reject), rejection reason
- Audit/history: immutable or append-only record of status/field changes and actors

## 7. Non-functional targets (to confirm)
- **NFR-1 (Validation latency):** Validation completes within **2 seconds at p95**.
- **NFR-2 (Notification latency):** Email dispatch within **1 minute at p95** of the triggering event.
- **NFR-3 (Availability):** **99.9%** monthly availability.
- **NFR-4 (Security):** Encrypt data in transit and at rest; enforce least-privilege access and secure session handling.

## 8. Assumptions and open questions (must confirm before/early in implementation)
1. **Pending balance effect:** Do pending (not yet decided) requests reserve balance immediately, or is balance checked only at submission/approval? (Impacts AC-1/AC-2 and overbooking.)
2. **Cross-year requests:** How are requests spanning 31 Dec–1 Jan accounted (split by policy year, credited on 1 Jan timing, and which year’s balance applies)?
3. **Half-day placement:** Is half-day specified as first/second half, morning/afternoon, or a 0.5-day count only? How does this interact with working-day/holiday calculations?
4. **No backup approver available:** What happens if the manager is unavailable and no backup is configured (block submission, escalate to HR, or queue)?
5. **Final service targets:** Confirm NFR-1/2/3 values, notification channels, retry/escalation behavior, and whether “decision within 2 working days” (AC-6) is an enforced SLA/escalation or a tracked target.
6. **LOP workflow details:** Exact HR approval step/state machine for excess days (requested together with paid days vs separate), and employee messaging when HR approval is pending/denied.
7. **Manager “on leave” source of truth:** Determined by approved leave in this system, HR flag, calendar integration, or manual configuration?

## 9. Traceability summary
| ID | Summary |
| --- | --- |
| AC-1 | CL request with sufficient balance and >=2 working days’ notice routes to manager |
| AC-2 | Insufficient balance shows "Not enough leave balance"; excess requires HR-approved LOP |
| AC-3 | CL requires 2 working days’ notice |
| AC-4 | SL allowed on day of leave or within 2 working days after return |
| AC-5 | Half-days allowed for CL and SL |
| AC-6 | Manager/backup can decide; target within 2 working days |
| AC-7 | Route to configured backup when manager unavailable/on leave |
| AC-8 | Rejection requires reason and employee is notified |
| AC-9 | Cancel approved leave before start; email manager and adjust balance |
| BR-1..3 | Entitlements, working-day calendar, no paid overdraw without HR-approved LOP |
| FR-1..7 | Validation, balances/status, routing, audit, RBAC, notifications |
| NFR-1..4 | Latency, availability, security targets |
