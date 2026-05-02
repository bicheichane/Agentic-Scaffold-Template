# Docs Completeness

- **Undocumented public APIs** — Check for exported functions, classes, endpoints, or configuration options in the source that have no corresponding documentation entry. Cross-reference source exports against documentation index/TOC.
- **Stale doc references** — Check for documentation that references renamed, moved, or deleted code elements (functions, files, config keys, CLI flags). Verify all documentation cross-references resolve to existing targets.
- **Missing changelog entries** — Verify that user-facing changes (new features, breaking changes, deprecations, behavioral changes) have corresponding changelog or release-notes entries.
- **Architecture doc drift** — Compare documented architecture (component diagrams, data flows, module boundaries) against actual implementation structure. Check for components that exist in the code but not in the architecture doc, or vice versa.
- **README accuracy** — Verify that README install steps, usage examples, configuration instructions, and prerequisites match the current codebase. Check that example commands and code snippets would work if copy-pasted.
