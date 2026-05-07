# Parent Reassurance Truth Table

This document is the internal reference for Parent dashboard reassurance behavior after the blocking corrective pass.

## Inputs

The Parent reassurance state is derived from the existing portal dashboard view-model data only:

- `statusBehavior.isTerminal`
- `statusBehavior.code`
- centralized `buildPortalRequiredActions()` output
- document statuses from the current checklist
- payment receipt statuses for the selected application
- current application status

No program-mode surface configuration, admin-only portal config, or message-inaccessible state participates in this decision.

## States

| State | Meaning |
| --- | --- |
| `ALL_GOOD` | Nothing currently requires Parent intervention, or the application is terminal. |
| `ACTION_REQUIRED` | Parent/user action is required from the centralized required-actions source, excluding messages-only attention. |
| `WAITING` | The case is with admin/review and no Parent action currently outranks the waiting state. |
| `NEEDS_ATTENTION` | A rejected/reupload-required document or payment receipt exists and needs attention before calm reassurance is appropriate. |

## Precedence

The implemented precedence is:

1. Terminal application behavior wins first.
   - If `statusBehavior.isTerminal` is true, return `ALL_GOOD`.
   - This keeps completed/cancelled cases from looking operationally active in Parent reassurance.
2. Problem documents or problem receipts win over active/ready calmness.
   - Any `REJECTED` or `REUPLOAD_REQUESTED` document returns `NEEDS_ATTENTION`.
   - Any `REJECTED` or `REUPLOAD_REQUESTED` payment receipt returns `NEEDS_ATTENTION`.
3. Centralized required actions win over READY calmness.
   - Any non-message action from `buildPortalRequiredActions()` returns `ACTION_REQUIRED`.
   - This is the READY override rule: READY remains a valid label, but it does not hide actionable issues.
4. Review/waiting signals return `WAITING`.
   - Documents or receipts with `UPLOADED` or `UNDER_REVIEW` can produce `WAITING`.
   - Application status `UNDER_REVIEW` can produce `WAITING`.
5. READY with no problem/action signals returns `ALL_GOOD`.
6. Fallback returns `ALL_GOOD`.

## Edge Cases

- READY plus rejected receipt: `NEEDS_ATTENTION`.
- READY plus rejected/reupload-required document: `NEEDS_ATTENTION`.
- READY plus centralized non-message required action: `ACTION_REQUIRED`.
- READY plus unread messages only: `ALL_GOOD`, because messages do not currently force Parent intervention.
- UNDER_REVIEW plus no higher-priority issue/action: `WAITING`.
- COMPLETED or CANCELLED: `ALL_GOOD` at the reassurance layer, while terminal wording is handled by the status behavior layer.

## Source Of Truth

The implementation lives in `deriveParentReassuranceState()` inside:

- `src/features/portal/server/get-portal-dashboard.ts`

Future changes to Parent reassurance must update this document and the implementation together.
