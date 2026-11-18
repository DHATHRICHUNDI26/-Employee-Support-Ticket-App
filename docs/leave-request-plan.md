# Plan — Leave Request and Approval

> **Planning note:** Spec Kit CLI/tooling (`specify`, `.specify`, Cursor Spec Kit commands) was not detected in this environment, so the Spec Kit **specify** and **plan** steps were executed manually by producing equivalent artifacts: `docs/leave-request-spec.md`, this plan, and `docs/leave-request-tasks.md`. No application code will be written until scope, open questions, and this plan are reviewed/approved.

## 1. Inputs and scope
- **Source:** User-provided "Leave Request and Approval Spec" (problem, scope, user stories/ACs, business rules, requirements, data, NFR targets, assumptions).
- **Specify artifact:** `docs/leave-request-spec.md` (structured spec with AC-1..AC-9, BR-1..BR-3, FR-1..FR-7, NFR-1..NFR-4, OQ-1..OQ-7, traceability).
- **In scope:** CL, SL, half-days, balance checks, approvals (manager + HR-configured backup), cancellation of approved leave before start, notifications, request history.
- **Out of scope:** Payroll, balance carryover, non-listed leave types, and production deployment concerns beyond stated targets.

## 2. Goals and success criteria
- Deliver a workflow where employees can submit valid CL/SL (including half-day) requests, see balances/status/history, and cancel approved leave before start (AC-1..AC-5, AC-9).
- Deliver a review workflow where managers/backup approvers can approve/reject within target timelines with required rejection reasons and routing fallback (AC-6..AC-8).
- Enforce entitlements, working-day/holiday calendar, notice rules, balance/LOP+HR-approval constraints, RBAC, and auditable records (BR-1..BR-3, FR-1..FR-7).
- Meet or explicitly phase/defer agreed NFR targets (NFR-1..NFR-4) with confirmed assumptions (OQ-1..OQ-7).

## 3. Assumptions, dependencies, and constraints
- **Open questions block implementation details:** OQ-1..OQ-7 (pending-balance reservation, cross-year accounting, half-day placement semantics, no-backup behavior, final SLAs/channels/escalation, LOP approval state machine, manager-unavailability source of truth) must be resolved before or during affected tasks; tasks are included to track decisions.
- **Calendar dependency:** A maintained company-holiday calendar and working-day definition (Mon–Fri excl. holidays) are required for notice and day-count calculations (BR-2).
- **Identity/roles dependency:** Authenticated user identity, employee-manager relationships, HR-configured backup approvers, and HR role assignments must be available/configurable.
- **Notification dependency:** Email delivery capability is required for stated events (AC-8, AC-9, FR-7, NFR-2); channel/retry behavior to be confirmed.
- **Existing repo context:** Current workspace is an Express/SQLite demo (ticket app). Implementing the leave spec as production-grade service meeting 99.9% availability, encryption-at-rest, and 1-minute p95 email dispatch may require architecture beyond the current demo stack; plan below is feature-oriented and calls out platform/NFR decisions.

## 4. Proposed architecture and design approach

### 4.1 Domain model (conceptual)
- **Employee profile/entitlement:** employee, policy year, CL/SL credited/available/used/pending/reserved (per resolved OQ-1), LOP tracking.
- **Leave request:** type, dates, half-day details, requested days (working days), policy year allocation, status, assigned approver, HR-approval/LOP state as needed.
- **Approval/routing:** reporting manager, backup approver config, unavailability signal/rule (OQ-7), routing and escalation behavior (OQ-4/OQ-5).
- **Notifications:** event records/outbox for submission, approval, rejection, cancellation (and any LOP/HR events defined).
- **Audit log:** append-only history of state/field changes with actor and timestamp (FR-5).

### 4.2 Core workflows
1. **Submit request:** validate inputs/notice/balance/calendar (FR-1, AC-1..AC-5, BR-1..BR-3) -> compute days/LOP impact -> apply pending-balance rule (OQ-1) -> route to manager or backup (AC-7, OQ-4/OQ-7) -> persist + notify.
2. **Review request:** authorized approver loads pending item -> approve or reject (reason required on reject, AC-8) -> persist decision/audit -> update balances/status -> notify employee (and HR if LOP flow requires).
3. **Cancel approved leave:** employee cancels before start (AC-9) -> validate timing -> adjust balances per policy -> persist/audit -> email manager.
4. **Year-end/cross-year handling:** entitlement crediting on 1 Jan (BR-1) and cross-year request accounting per decision (OQ-2).

### 4.3 Validation and calculation rules
- Centralize working-day/holiday and notice calculations to ensure consistent enforcement of AC-1, AC-3, AC-4, AC-5, BR-2.
- Server-side authoritative validation with clear user-facing messages (FR-1, FR-2), including the exact message **"Not enough leave balance"** when applicable (AC-2).
- Explicit state machine for request status and (if needed) LOP/HR-approval substates (OQ-6).

## 5. Implementation phases

### Phase 0 — Decisions and foundations
- Resolve/record OQ-1..OQ-7 with stakeholders; confirm NFR targets/channels.
- Define request state machine, balance semantics, holiday source, and approver configuration model.
- Establish data model/migrations, RBAC boundaries, and audit/notification patterns.

### Phase 1 — Employee request and balance experience
- Entitlement setup/display (BR-1, FR-3) and working-day calculator (BR-2).
- Request creation UI/API: CL/SL, dates, half-day (AC-5), validation and notice rules (AC-1, AC-3, AC-4, FR-1/FR-2).
- Balance checks, insufficient-balance messaging, and LOP/HR-approval path per confirmed design (AC-2, BR-3).
- Request history and status visibility (FR-3, FR-4).

### Phase 2 — Approval and routing
- Manager/backup approver queues and authorization (FR-6).
- Routing to manager or configured backup when unavailable (AC-7, OQ-4/OQ-7).
- Approve/reject actions with mandatory rejection reason, timestamps, audit (AC-6 target tracked, AC-8, FR-5).
- Notifications for submission/decision outcomes (FR-7, AC-8).

### Phase 3 — Cancellation and adjustments
- Employee cancellation of approved leave before start date (AC-9).
- Balance recalculation/adjustment, audit, and manager email notification (AC-9, FR-5, FR-7).

### Phase 4 — NFRs, hardening, and verification
- Performance validation for p95 targets (NFR-1, NFR-2) and async/outbox tuning as needed.
- Security controls: encryption in transit/at rest, least privilege, secure sessions (NFR-4); operational availability measures per platform (NFR-3).
- End-to-end tests mapped to AC-1..AC-9 and BR/FR rules; regression coverage for edge cases from OQ decisions.

## 6. Verification strategy
- **Acceptance tests:** one or more automated/integration scenarios per AC-1..AC-9 (including exact error text for AC-2, notice boundary cases, half-day cases, backup routing, rejection-reason enforcement, cancellation timing and balance/email effects).
- **Rule tests:** entitlement crediting (BR-1), working-day/holiday math (BR-2), paid-balance/LOP constraints (BR-3), RBAC negative cases (FR-6), audit completeness (FR-5).
- **Non-functional checks:** latency measurement approach for validation/notification p95 (NFR-1/2), security review checklist (NFR-4), and availability/SLO approach documented (NFR-3) — acknowledging environment/platform dependencies.
- **Manual/UAT:** role-based walkthroughs (employee, manager, backup, HR) and notification receipt/timing spot checks once channels are configured.

## 7. Risks and mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Unresolved OQ-1/OQ-2/OQ-6 | Incorrect balances, double-booking, or wrong year attribution | Decision tasks early (Phase 0); encode rules in a single domain service with tests |
| Missing/incorrect holiday or approver config (OQ-4/OQ-7) | Wrong notice/day counts or unroutable requests | Validation and actionable errors; admin/config checks; escalation path per policy |
| NFR targets exceed demo stack capabilities (NFR-2/3/4) | Targets unmet in current environment | Document platform requirements; use outbox/queue patterns; phased hardening |
| LOP+HR approval complexity (AC-2, OQ-6) | User confusion and inconsistent states | Explicit state machine, clear messaging, and audit/notification coverage |

## 8. Deliverables
- `docs/leave-request-spec.md` — specify output (done).
- `docs/leave-request-plan.md` — this plan.
- `docs/leave-request-tasks.md` — task breakdown with acceptance-criterion linkage review and flagged gaps.
- (Post-approval, future work) implementation, migrations, tests, and operational/runbook updates aligned to confirmed decisions.