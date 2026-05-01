# Spec Fidelity

- **Plan deviations** — Check for code that does something different from what the plan specified without a corresponding divergence file. Compare implementation against the relevant coder slice.
- **Baked-in assumptions** — Identify decisions the code makes that the plan was silent on: default values chosen without justification, behavior inferred but not specified, edge cases handled in a specific way when the plan didn't address them.
- **Missing pieces** — Check for things the plan called for that the code doesn't implement. Cross-reference the coder slice's "Code Changes" section against the actual files.
- **Scope additions** — Check for code that introduces functionality, abstractions, or behaviors beyond what the plan specified. Even if well-intentioned, undocumented additions change scope.
- **Divergence file audit** — If divergence files exist at `agent-artifacts/feedback/coder/implementation-divergences-*.md`, verify they accurately describe the actual divergences and were approved by the user.
