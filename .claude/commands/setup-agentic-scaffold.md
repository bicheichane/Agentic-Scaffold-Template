---
description: Install or refresh the Agentic Scaffold Template into ~/.claude/.
---

Run the install script for this meta-template. Pick the script path based on whether a prior install exists, so the command works whether the user is inside the meta-template repo or in any other workspace:

- If `$HOME/.claude/agentic-scaffold/install.mjs` exists (a prior install symlinked it), run `node "$HOME/.claude/agentic-scaffold/install.mjs" install` — works from any workspace.
- Otherwise (first-time install), run `node scripts/install.mjs install` — assumes the current working directory is the meta-template repo clone.

After it completes, report:
- Which agents are now linked into `~/.claude/agents/`.
- Whether `~/.claude/agentic-scaffold/` and `~/.claude/commands/setup-agentic-scaffold.md` are correctly linked.
- Any warnings or errors from the script.

The install is idempotent — re-running is safe and is how the user pulls in newly added agents.
