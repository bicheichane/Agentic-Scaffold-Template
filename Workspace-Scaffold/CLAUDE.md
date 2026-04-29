# Example Workspace

A worked example of a populated `CLAUDE.md`. The `workspace-scaffold` agent walks the user through this schema interactively. Sections you don't need can be skipped.

## Project name + description

**Acme Widget Service.** A small HTTP API that issues, redeems, and revokes single-use widget tokens for the Acme retail platform.

## Tech stack

- TypeScript on Node.js 20+
- Fastify (HTTP), Prisma (ORM), PostgreSQL 16
- Vitest for unit + integration tests
- ESLint + Prettier

## Repository paths

- **Source:** `src/`
- **Tests:** `test/` (unit + integration co-located by feature)
- **Models / types:** `src/models/`
- **Architecture doc:** `docs/architecture.md`
- **Business-rules doc:** `docs/business-rules.md`

## Build & test commands

- Install: `npm ci`
- Build: `npm run build`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Test (all): `npm test`
- Test (single file): `npm test -- test/path/to/file.test.ts`

## Naming conventions

- File names: kebab-case (`token-service.ts`).
- Branch names: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.).

## Domain glossary

- **Token** — a single-use credential that authorizes one widget redemption.
- **Issuer** — the merchant integration that mints tokens.
- **Redemption** — the act of consuming a token at point-of-sale.
