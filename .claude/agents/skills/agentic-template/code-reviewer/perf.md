# Performance

- **N+1 queries** — Check for loops that issue a database query or API call per iteration when a batch operation is available.
- **Unbounded collections** — Verify that queries and collection operations include pagination, limits, or streaming for potentially large result sets. Check for `SELECT *` without `LIMIT`.
- **Hot-path expense** — Identify heavy computation, synchronous I/O, or large allocations in frequently-called code paths. Verify these are justified or cacheable.
- **Missing caching** — Check for repeated expensive lookups of data that doesn't change within the request or operation scope.
- **Memory concerns** — Verify large object lifetimes are bounded, buffers are sized or capped, and cleanup/disposal happens at appropriate boundaries (connections, streams, timers).
