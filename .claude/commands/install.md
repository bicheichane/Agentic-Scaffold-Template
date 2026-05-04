---
description: Install the Agentic Scaffold into ~/.claude/ (run from this repo only).
---

Run the install script from the repo root:

```bash
node setup/install.mjs install
```

This uses a relative path because this command is local-only — it only runs when the user has this repo open, so the working directory is always the repo root.

After the script completes, report:
- Which agents are now linked into `~/.claude/agents/`
- Whether `~/.claude/agentic-scaffold/` is correctly linked to `scripts/`
- Whether `~/.claude/commands/setup-agentic-scaffold.md` is correctly linked
- Whether `~/.claude/agents/skills/agentic-template/` is correctly linked
- Whether `~/.claude/settings.json` was updated to set the default agent to `planner`
- Any warnings or errors from the script

The script is idempotent — re-running is safe and is how the user pulls in newly added agents or refreshes the install.
