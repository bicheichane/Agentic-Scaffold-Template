---
description: Install or refresh the Agentic Scaffold Template into ~/.claude/.
---

Run the install script for this meta-template. Pick the script path based on whether a prior install exists, so the command works whether the user is inside the meta-template repo or in any other workspace:

- If `$HOME/.claude/agentic-scaffold/install.mjs` exists (a prior install symlinked it), run `node "$HOME/.claude/agentic-scaffold/install.mjs" install` — works from any workspace.
- Otherwise (first-time install), run `node scripts/install.mjs install` — assumes the current working directory is the meta-template repo clone.

After the install completes, run the workspace scaffold script to set up the current workspace's `.claude/` directory structure (override stubs, epics dir, gitignore entry):

- If `$HOME/.claude/agentic-scaffold/scaffold.mjs` exists (a prior install symlinked it), run `node "$HOME/.claude/agentic-scaffold/scaffold.mjs" init` — works from any workspace.
- Otherwise (first-time install, scaffold link not yet resolved), run `node scripts/scaffold.mjs init` — assumes the current working directory is the meta-template repo clone.

After both steps complete, report:
- Which agents are now linked into `~/.claude/agents/`.
- Whether `~/.claude/agentic-scaffold/` and `~/.claude/commands/setup-agentic-scaffold.md` are correctly linked.
- What the scaffold step created or skipped in the current workspace.
- Any warnings or errors from either script.

Both scripts are idempotent — re-running is safe and is how the user pulls in newly added agents or refreshes the workspace scaffold.