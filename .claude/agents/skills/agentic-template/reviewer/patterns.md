# Patterns & Consistency

- **Convention violations** — Verify naming, file structure, and module organization match the conventions established in `CLAUDE.md` and the existing codebase.
- **Inconsistent patterns** — Check that new code follows the same patterns as existing code for similar concerns. If a different approach is used, verify it was explicitly approved (divergence file or plan).
- **Unnecessary abstractions** — Check for premature generalization, wrapper types that add no value, over-engineered factories/registries/builders for things used in one place.
- **Dead code** — Identify unused imports, unreachable branches, commented-out blocks, and unused variables or functions.
- **Domain naming** — Verify that names match the terminology in the specs, plan, and domain glossary (if defined in `CLAUDE.md`). Check for invented synonyms that diverge from established domain language.
