# Test Coverage Map

- **Untested public API surfaces** — Check for exported functions, classes, methods, or endpoints in the source that have no corresponding test file or test case. Cross-reference source file exports against test file imports and test targets.
- **Missing edge-case categories** — Verify that error paths, boundary conditions (empty inputs, max values, off-by-one), and concurrency scenarios are covered for each public API surface. Check that happy-path-only coverage is flagged.
- **Test file organization** — Verify that test file structure mirrors source structure. Check for test files that don't correspond to any source file, or source directories with no parallel test directory.
- **Orphaned test files** — Check for test files that cover source modules that have been renamed, moved, or deleted. Cross-reference test file imports against the current source tree.
- **Integration gap detection** — Check for source modules that interact across boundaries (e.g., service-to-database, controller-to-service) where only unit tests exist but no integration test covers the interaction.
