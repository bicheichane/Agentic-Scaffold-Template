# Agentic Scaffold Template

A structured sub-agent pipeline for **Claude Code** that keeps context windows small, routes work to focused workers, and puts a human decision point at every stage.

## Why this exists

Long-running agent sessions get worse as the context grows. The model is working harder to track state that could have lived on disk. Token costs go up while output quality goes down. Stuffing more into one conversation window doesn't solve either problem.

This scaffold breaks work into single-purpose agents, each of which receives only the slice it needs. A planner holds the plan and orchestrates; workers (coder, qa, docs) get a focused plan slice and the relevant files. State lives on disk in artifact files under `agent-artifacts/`, not in conversation memory. Parallelism within a step follows from this design as a side-effect.

Every pipeline stage ends with an explicit checkpoint: trigger an agent review, do a manual review yourself, or proceed. Review agents are adversarial by design. Findings come back with full context. The user decides what to act on. This is not a tool that runs to completion and hopes for the best.

The user engages the planner agent. The planner guides every transition with concrete options. There are no special commands to memorize and no README to keep referring back to during actual work.

## Setup

1. Clone this repo somewhere persistent.
2. Open the clone in Claude Code.
3. Run the slash command `/setup-agentic-scaffold`.

The slash command runs `scripts/install.mjs`, which symlinks four things into `~/.claude/`:

- Each `.claude/agents/<name>.md` → `~/.claude/agents/<name>.md` (so the agent picker shows them in every workspace).
- The repo's `.claude/agents/skills/agentic-template/` → `~/.claude/agents/skills/agentic-template/` (so skill files for `code-reviewer` are available at runtime).
- The repo's `scripts/` directory → `~/.claude/agentic-scaffold/` (so agents can call scaffold scripts by an absolute, version-stable path).
- Each `.claude/commands/<name>.md` → `~/.claude/commands/<name>.md` (so the slash command itself is globally available after the first install).

Re-run `/setup-agentic-scaffold` any time to refresh — the install is idempotent.

## Usage

Open any workspace in Claude Code and pick an agent from the agent picker. Only a subset are user-invocable; the rest are spawned by `planner` as part of the feature pipeline.

| Agent | User-invocable | Model | Role |
|---|---|---|---|
| `planner` | yes | Inherit | **Entry point for all feature/bug work.** Drafts the plan, spawns workers in sequence, integrates outcomes. |
| `coder` | no (planner-spawned only) | Sonnet 4.6 | Implements code per the planner's coder slice. |
| `qa` | no (planner-spawned only) | Sonnet 4.6 | Implements + runs tests; reports failures with a hypothesis. |
| `docs` | no (planner-spawned only) | Sonnet 4.6 | Updates project documentation. Audit role flows through reviewer tiers instead. |
| `generic` | yes | Sonnet 4.6 | Ad-hoc / one-off tasks outside the feature pipeline. Can spawn reviewer agents on demand. |
| `plan-reviewer` | no (agent-spawned) | inherit | Reviews implementation plans for feasibility, scope, execution-graph quality, and architectural alignment. |
| `code-reviewer` | no (agent-spawned) | inherit | Skill-loaded code reviewer. Loads heuristic checklists per caller-supplied slug. Supports parallel invocation. |
| `alignment-reviewer` | no (agent-spawned) | inherit | Reviews cross-artifact consistency (plan ↔ code ↔ tests ↔ docs). Final pipeline pass. |
| `issue-tracker` | no (planner-spawned only) | Sonnet 4.6 | Frontmatter-Sync bridge to Azure DevOps / GitHub. |
| `workspace-scaffold` | yes | Sonnet 4.6 | One-shot setup for a new workspace. Run once. |

`planner` is the entry point for all feature/bug work — there is no escape hatch around it. The other user-invocable agents (`generic`, `workspace-scaffold`) cover ad-hoc tasks and scaffold setup respectively. Reviewer agents (`plan-reviewer`, `code-reviewer`, `alignment-reviewer`) are spawned by other agents and not intended for direct user invocation.

## Per-workspace setup

In a new workspace, run `workspace-scaffold` once. It runs the deterministic script (`scripts/scaffold.mjs init --workspace=<path>`) to create:

- `.claude/specific-agent-instructions/` — per-agent override stubs (one for each agent the user can extend).
- `.claude/specific-agent-instructions/README.md` — auto-generated index.
- `.claude/epics/.gitkeep` — committed, populated by user + `issue-tracker` over time.
- A `.gitignore` entry for `agent-artifacts/` (idempotent: appended only if missing).

Then it walks the user through three interactive steps:

1. **Populating `CLAUDE.md`** — tech stack, paths, commands, conventions.
2. **Auditing for unexpected files** in `.claude/specific-agent-instructions/`.
3. **Configuring the issue tracker** — auto-detects Azure DevOps or GitHub from `git remote -v` and writes `.claude/specific-agent-instructions/issue-tracker.md` plus `.vscode/mcp.json`.

`agent-artifacts/` is **not** created at scaffold time. Agents create it lazily on first write during real feature work.

## How configuration is layered

| File | Scope |
|---|---|
| `CLAUDE.md` (workspace root) | Project-wide facts: tech stack, paths, build/test commands, naming conventions. Read by every agent on startup. |
| `.claude/specific-agent-instructions/<agent>.md` | Per-agent behavior overrides. Read only by the named agent. |

All workspace-specific values (paths, names, commands, tech stack) live in `CLAUDE.md` — never inside the agent files themselves. The agent files describe generic behavior; the per-agent override files exist only for behavior-specific guidance that doesn't fit the cross-cutting `CLAUDE.md`.

## Pipeline state on disk

`planner` orchestrates a single feature lifecycle. All inter-agent state lives on disk in `agent-artifacts/` (gitignored, transient per work item):

```
agent-artifacts/
  implementation-plan.md                        # high-level proposal seen by user
  implementation-plan-coder-{step}{node}.md     # one coder slice per execution-graph node (e.g. 1a, 1b, 2a)
  implementation-plan-tests.md                  # focused slice for qa
  implementation-plan-docs.md                   # focused slice for docs
  coder-outcome-{step}{node}.md                 # one outcome per coder node; written by coder, read by planner
  qa-outcome.md                                 # written by qa, read by planner
  docs-outcome.md                               # written by docs, read by planner
  feedback/
    coder/implementation-divergences-{step}{node}.md  # per-node; written by coder when divergences occur
    qa/failure-report.md                        # written by qa when tests fail
    planner/questions.md
  reviews/
    plan-review.md                              # written by plan-reviewer, overwritten each run
    code-review-{slug}.md                       # written by code-reviewer (one per skill slug)
    alignment-review.md                         # written by alignment-reviewer, overwritten each run
```

`planner` runs an **artifact-tree inventory** on every startup — surfaces what it finds to the user, asks whether to resume / start fresh / inspect, and wipes only with explicit confirmation. The tree is the state; the user is the source of truth.

## Repository layout

```
CLAUDE.md                          # Stub orientation file for this meta-template
README.md                          # This file
.claude/
  agents/                          # Agent definitions installed to ~/.claude/agents/
    skills/
      agentic-template/
        code-reviewer/             # Skill files loaded by code-reviewer per slug
  commands/                        # Slash commands installed to ~/.claude/commands/
    setup-agentic-scaffold.md
  specific-agent-instructions/     # Empty stubs — committed, demonstrate override surface
  epics/                           # Empty (.gitkeep) — committed, demonstrates issue-tracker target
scripts/
  scaffold.mjs                     # Deterministic part of workspace-scaffold (Node 18+, no deps)
  install.mjs                      # Symlinks agents, skills, scripts, and slash commands into ~/.claude/
  dispatch-manifest.mjs            # Scoped reviewer/skill manifest for consuming agents
Workspace-Scaffold/                # Fixture mirroring what end-user workspaces get post-scaffold
docs/
  plan.md                          # Merge plan (design history)
```

## Notes

- Windows: file symlinks need Developer Mode or admin to be created without prompting. `install.mjs` probes for symlink support and prints a clear error if it fails.
- After `git pull` in this repo, re-run `/setup-agentic-scaffold` to pick up newly added agents.
- There is no GitHub Copilot integration. The scaffold uses `CLAUDE.md` and Claude Code's native sub-agent conventions; agents communicate in plain conversation without special markers or custom tooling.
- The install script automatically cleans up dangling agent symlinks on re-install. After upgrading from a version that had different agents (e.g., the single `reviewer` agent), re-running `/setup-agentic-scaffold` removes stale symlinks and creates the new ones in one step.
