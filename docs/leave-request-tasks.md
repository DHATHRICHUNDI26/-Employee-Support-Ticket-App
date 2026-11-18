# Tasks — Leave Request and Approval

> **Traceability rule (per request):** every task is reviewed for linkage to an acceptance criterion (**AC-1..AC-9** from `docs/leave-request-spec.md`). Any task that does **not** link to an acceptance criterion is explicitly **flagged** below, even if it supports BR/FR/NFR/OQ items.
>
> **Note:** Spec Kit CLI/tooling was not detected in this environment; this task list was produced as the manual output of the Spec Kit plan/tasks step.

## Flagged tasks (no acceptance-criterion link)
| Task ID | Reason flagged | Related non-AC links |
| --- | --- | --- |
| T-01 | Decision/config groundwork, not an acceptance criterion itself | OQ-1..OQ-7, NFR-1..NFR-4 |
| T-02 | Domain/state-model definition work without direct AC statement | FR-4, FR-5, OQ-1, OQ-6 |
| T-03 | Data/schema foundation task | FR-3, FR-4, FR-5, BR-1 |
| T-04 | RBAC foundation task (enables but not stated as an AC) | FR-6 |
| T-05 | Notification infrastructure foundation task | FR-7, NFR-2 |
| T-23 | Performance validation target, not an AC | NFR-1 |
| T-24 | Notification latency/reliability target, not an AC | NFR-2, FR-7 |
| T-25 | Availability target/operational readiness, not an AC | NFR-3 |
| T-26 | Security controls target, not an AC | NFR-4, FR-6 |
| T-27 | Documentation/runbook deliverable, not an AC | FR-5, FR-7, NFR-1..NFR-4 |

**Total flagged:** 10 task(s). All other tasks link to at least one acceptance criterion.

## Task breakdown

### Phase 0 — Decisions and foundations
| ID | Task | AC link(s) | Other links | Flag | Notes / dependency |
| --- | --- | --- | --- | --- | --- |
| T-01 | Resolve and document open questions (pending-balance policy, cross-year accounting, half-day placement, no-backup behavior, SLA/channel/escalation targets, LOP/HR-approval flow, manager-unavailability source of truth). | — | OQ-1..OQ-7, NFR-1..NFR-4 | **FLAG: No acceptance-criterion link** | Blocks/steers T-06, T-07, T-10, T-11, T-14, T-16, T-20. |
| T-02 | Define request and (if required) LOP/HR-approval state machine, transitions, and timestamp/audit events. | — | FR-4, FR-5, OQ-1, OQ-6 | **FLAG: No acceptance-criterion link** | Enables consistent implementation of AC-6/AC-8/AC-9 flows. |
| T-03 | Design and implement data model/migrations for employees/approvers, entitlements/balances, leave requests, workflow fields, notifications/outbox (as needed), and audit history. | — | FR-3, FR-4, FR-5, BR-1 | **FLAG: No acceptance-criterion link** | Foundation for all user stories. |
| T-04 | Implement RBAC/authorization framework for employee, manager, backup approver, and HR roles. | — | FR-6 | **FLAG: No acceptance-criterion link** | Must be applied in T-09, T-13, T-15, T-19, T-20, T-21. |
| T-05 | Implement notification/event infrastructure (templating, dispatch/outbox, delivery tracking) with email channel support. | — | FR-7, NFR-2 | **FLAG: No acceptance-criterion link** | Required for AC-8/AC-9 email delivery tasks. |

### Phase 1 — Employee request, balances, and validation (US-1, US-2)
| ID | Task | AC link(s) | Other links | Flag | Notes / dependency |
| --- | --- | --- | --- | --- | --- |
| T-06 | Configure annual entitlements (12 CL, 8 SL per calendar year, credited 1 Jan) and expose balance data per policy year. | AC-1, AC-2 | BR-1, BR-3, FR-3, OQ-2 | — | Depends on T-01, T-03. |
| T-07 | Implement working-day/holiday calendar and day-count/notice calculation utilities (Mon–Fri, excl. company holidays). | AC-1, AC-3, AC-4, AC-5 | BR-2, OQ-2, OQ-3 | — | Depends on T-01 (holiday source/cross-year rules). |
| T-08 | Build leave request submission UI/API for CL/SL with date range and half-day capture per confirmed semantics. | AC-1, AC-4, AC-5 | FR-1, FR-3, OQ-3 | — | Depends on T-03, T-07. |
| T-09 | Implement server-side validation: leave type/dates/half-day/requested days, CL >=2 working days’ notice, SL same-day or within 2 working days after return, and clear user-facing errors. | AC-1, AC-3, AC-4, AC-5 | FR-1, FR-2, BR-2 | — | Depends on T-07, T-08. |
| T-10 | Implement balance evaluation and insufficient-balance handling: show exact message **"Not enough leave balance"** when applicable; enforce paid-balance limits and route excess to HR-approved LOP flow per policy. | AC-1, AC-2 | BR-1, BR-3, FR-1, FR-3, OQ-1, OQ-6 | — | Depends on T-01, T-06, T-09. |
| T-11 | Route submitted valid requests to reporting manager by default, or to configured backup when manager is unavailable/on leave per defined rule. | AC-1, AC-7 | FR-4, OQ-4, OQ-7 | — | Depends on T-01, T-03, T-04. |
| T-12 | Persist request submission state, timestamps, and initial audit entries; notify/request-routed event as defined. | AC-1, AC-7 | FR-4, FR-5, FR-7 | — | Depends on T-03, T-05, T-11. |
| T-13 | Provide employee views for current balances, request status, and request history (authorized access only). | AC-1, AC-2 | FR-3, FR-4, FR-6 | — | Depends on T-03, T-04, T-10, T-12. |

### Phase 2 — Review, routing fallback, and decisions (US-3)
| ID | Task | AC link(s) | Other links | Flag | Notes / dependency |
| --- | --- | --- | --- | --- | --- |
| T-14 | Build approver queue/detail views and actions for manager and HR-configured backup approver on routed requests. | AC-6, AC-7 | FR-4, FR-6, OQ-4 | — | Depends on T-04, T-11, T-12. |
| T-15 | Implement approve/reject decision handling with required rejection reason, server-side validation, actor/timestamp recording, and audit trail updates. | AC-6, AC-8 | FR-1, FR-2, FR-5, FR-6 | — | Depends on T-02, T-14. |
| T-16 | Implement decision-timeliness support: track submission/routing/decision times and surface/escalate per confirmed target behavior for “within 2 working days”. | AC-6 | NFR-2 (if escalations notify), OQ-5 | — | Depends on T-01, T-12, T-15. |
| T-17 | Send employee notifications on approval and on rejection including the recorded reason. | AC-8 | FR-7, NFR-2 | — | Depends on T-05, T-15. |
| T-18 | Update balances/status and any pending-reservation/LOP-HR state consistently on decision outcomes. | AC-2, AC-6, AC-8 | BR-3, FR-3, FR-4, FR-5, OQ-1, OQ-6 | — | Depends on T-10, T-15. |

### Phase 3 — Cancellation of approved leave (US-4)
| ID | Task | AC link(s) | Other links | Flag | Notes / dependency |
| --- | --- | --- | --- | --- | --- |
| T-19 | Implement employee cancellation action for **approved** leave requests only when requested before the leave start date (with clear validation/errors otherwise). | AC-9 | FR-1, FR-2, FR-4, FR-6 | — | Depends on T-04, T-12, T-15. |
| T-20 | On valid cancellation, adjust balances per confirmed policy, persist cancellation timestamps/state, and append audit history. | AC-9 | BR-3, FR-3, FR-5, OQ-1 | — | Depends on T-01, T-06, T-18, T-19. |
| T-21 | Send manager email notification when an approved leave is cancelled. | AC-9 | FR-7, NFR-2 | — | Depends on T-05, T-19, T-20. |

### Phase 4 — NFRs, hardening, and verification
| ID | Task | AC link(s) | Other links | Flag | Notes / dependency |
| --- | --- | --- | --- | --- | --- |
| T-22 | Create automated tests mapped to AC-1..AC-9 (submission/routing, exact insufficient-balance message, notice rules, half-days, backup routing, reject-reason required, cancellation timing/effects/notification triggers) and key BR/FR negative cases. | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9 | BR-1, BR-2, BR-3, FR-1, FR-2, FR-5, FR-6, FR-7 | — | Depends on implemented phases. |
| T-23 | Measure and tune validation performance to meet **2 seconds p95** target (or document gap/mitigation). | — | NFR-1 | **FLAG: No acceptance-criterion link** | Requires test/load approach and environment data. |
| T-24 | Measure and tune notification/email dispatch to meet **1 minute p95** target; implement retries/monitoring per confirmed policy. | — | NFR-2, FR-7 | **FLAG: No acceptance-criterion link** | Depends on T-05 and channel/provider choice. |
| T-25 | Define and implement availability/SLO approach to support **99.9% monthly availability** target (infrastructure, health checks, failover/runbook as applicable). | — | NFR-3 | **FLAG: No acceptance-criterion link** | Platform/deployment dependent. |
| T-26 | Implement and verify security controls: encryption in transit and at rest, least-privilege access, and secure session/secret handling. | — | NFR-4, FR-6 | **FLAG: No acceptance-criterion link** | Platform/deployment dependent. |
| T-27 | Produce operational/support documentation (configuration for holidays/approvers/HR roles, notification behavior, audit access, known limitations, and OQ decisions). | — | FR-5, FR-7, NFR-1..NFR-4, OQ-1..OQ-7 | **FLAG: No acceptance-criterion link** | Handoff/readiness artifact. |

## Acceptance-criterion coverage check
| AC | Covered by task(s) |
| --- | --- |
| AC-1 | T-06, T-07, T-08, T-09, T-10, T-11, T-12, T-13, T-22 |
| AC-2 | T-06, T-10, T-13, T-18, T-22 |
| AC-3 | T-07, T-09, T-22 |
| AC-4 | T-07, T-08, T-09, T-22 |
| AC-5 | T-07, T-08, T-09, T-22 |
| AC-6 | T-14, T-15, T-16, T-18, T-22 |
| AC-7 | T-11, T-12, T-14, T-22 |
| AC-8 | T-15, T-17, T-18, T-22 |
| AC-9 | T-19, T-20, T-21, T-22 |

All acceptance criteria (AC-1..AC-9) are linked to at least one task. Tasks without AC linkage are flagged in the summary and inline per the review requirement.