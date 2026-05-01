# Agentic-Scaffold-Template

This repository is the meta-template for the Agentic Scaffold — a Claude-Code-only sub-agent scaffold installed globally into `~/.claude/`.

It is **not** a workload project. There is no production tech stack, no source/tests directories to point agents at, and no business-rules document. This file exists only as an orientation stub for contributors browsing the repo.

## What lives here

- `.claude/agents/` — agent definitions (one `<name>.md` per agent). Installed to `~/.claude/agents/` via `scripts/install.mjs`.
- `.claude/commands/` — slash commands (`/setup-agentic-scaffold`). Installed to `~/.claude/commands/` via `scripts/install.mjs`.
- `.claude/specific-agent-instructions/` — empty override stubs that demonstrate the per-agent override surface.
- `.claude/epics/` — committed, empty (`.gitkeep`) in this repo; demonstrates where the `issue-tracker` agent writes in end-user workspaces.
- `scripts/scaffold.mjs` — the deterministic part of `workspace-scaffold`. Cross-platform Node 18+, no deps.
- `scripts/install.mjs` — symlinks agents, skills, scripts, and slash commands into the user's `~/.claude/`.
- `scripts/dispatch-manifest.mjs` — scoped reviewer/skill manifest for consuming agents. Called at runtime via `--scope=<consumer>`.
- `Workspace-Scaffold/` — fixture that mirrors what `workspace-scaffold` produces in an end-user workspace.
- `docs/plan.md` — the merge plan (the design history of how this repo arrived at its current shape).

## Working in this repo

Contributors can dogfood agent invocations from inside this repo: open it in Claude Code and pick `planner` (or any other user-invocable agent) from the agent picker. The committed-but-empty stubs under `.claude/specific-agent-instructions/` give you a place to drop repo-specific overrides without bootstrapping a separate workspace first.

`agent-artifacts/` is gitignored — agents will create it lazily on first write. Do not commit anything inside it.

## Skill file authorship

Skill files under `.claude/agents/skills/` are read by reviewer agents (as review heuristics — "what to flag") and will be read by sub-planner agents in Phase 2 (as planning context — "what to account for"). When creating or updating skill files, use dual-use language that reads naturally for both audiences:

- **Do:** "Ensure parameterized queries for SQL" / "Verify assertions are specific"
- **Don't:** "Flag this in the review output" / "Include this in the coder slice"

Neutral phrasing ("ensure", "verify", "check for") works for both review and planning contexts. Avoid language that only makes sense for one consumer.

## Install workflow

Clone this repo somewhere persistent, open it in Claude Code, run `/setup-agentic-scaffold`. The slash command runs `scripts/install.mjs`, which symlinks agents, skills, the `scripts/` directory, and the slash command itself into `~/.claude/`. Re-run any time to refresh the install (idempotent).
