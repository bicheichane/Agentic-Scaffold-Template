# Error Handling & Resilience

- **Swallowed errors** — Check for empty catch blocks, errors that are logged but not propagated, and catch-all handlers that silently suppress failures.
- **System boundary gaps** — Verify that all external interactions (network calls, file I/O, database queries, third-party APIs) have error handling at the call site.
- **Partial failure** — Check operations that can half-succeed (e.g., 3 of 5 writes committed, then a crash). Verify transactional boundaries or compensating logic exists where needed.
- **Error message quality** — Verify error messages are actionable for the consumer. Check that they don't leak internals (stack traces, connection strings, internal paths) to external callers.
- **Retry & timeout** — Check external calls for timeout configuration. Verify retry logic includes backoff and idempotency checks where applicable.
