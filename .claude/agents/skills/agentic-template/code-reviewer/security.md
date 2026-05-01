# Security

- **Injection vectors** — Ensure parameterized queries for SQL, output encoding for XSS, and input sanitization for command and template injection at all system boundaries.
- **Authentication & authorization gaps** — Verify that access-controlled endpoints and operations have auth checks at every entry point. Check for missing middleware, bypassed guards, or inconsistent enforcement.
- **Exposed secrets** — Check for hardcoded keys, tokens, or credentials in source. Verify secrets are not logged, included in error messages, or exposed in API responses.
- **Unsafe defaults** — Verify secure defaults: restrictive CORS, debug mode disabled in production, validation enabled, secure transport enforced.
- **Input trust boundary** — Identify where user input enters the system. Verify that input is validated and sanitized before crossing trust boundaries. Check that trust is not extended past the boundary without explicit validation.
