# Portal deferred notes

This note records accepted product questions that are intentionally deferred after portal Phases 0-4 and the pre-Phase 5 hardening pass.

## Deferred product questions

- READY status behavior: `READY` may remain a calm label only when no centralized required action or problem document/receipt exists. Action-required signals override READY calmness.
- Parent reassurance behavior: the frozen truth table is documented in `docs/portal/parent-reassurance-truth-table.md`.
- Document completion semantics: decide later whether document completion should remain presence-based, or become approval-aware for stricter operational meaning.
- Document section summaries: the documents action-needed signal is now unified with centralized required-actions derivation. Broader document summary semantics, such as how strongly to weight pending review vs approved, may still evolve later if product requirements change.

## Guardrails

- Do not change stage derivation precedence, Parent reassurance precedence, READY override behavior, or thread visibility policy as part of visual polish.
- Do not add unsupported program widgets or fake enrollment/travel/schedule data.
- Preserve `?applicationId=...` continuity for portal section navigation.
