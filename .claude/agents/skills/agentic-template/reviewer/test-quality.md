# Test Quality

- **Coverage gaps** — Check for code paths the tests don't exercise, especially error paths, edge cases, and boundary conditions. Verify that the plan's key scenarios are each covered by at least one test.
- **Assertion quality** — Verify assertions are specific and test the right thing. Check for weak assertions like `toBeTruthy()` on complex objects, or assertions that pass trivially.
- **Test isolation** — Check that tests don't depend on execution order, shared mutable state, or external services without mocking. Verify each test can run independently.
- **Flakiness risk** — Check for timing dependencies, non-deterministic data (random values, current timestamps), date/time sensitivity, and network dependencies that could cause intermittent failures.
- **Overspecification** — Check for tests so tightly coupled to implementation details that any refactor would break them. Verify tests assert on behavior and outputs, not internal structure.
