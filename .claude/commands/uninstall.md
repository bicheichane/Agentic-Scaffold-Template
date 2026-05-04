---
description: Uninstall the Agentic Scaffold from ~/.claude/ (run from this repo only).
---

Run the uninstall script from the repo root:

```bash
node setup/uninstall.mjs
```

This uses a relative path because this command is local-only — it only runs when the user has this repo open, so the working directory is always the repo root.

After the script completes, report:
- Which agent symlinks were removed from `~/.claude/agents/`
- Whether `~/.claude/agentic-scaffold/` symlink was removed
- Whether `~/.claude/commands/setup-agentic-scaffold.md` symlink was removed
- Whether `~/.claude/agents/skills/agentic-template/` symlink was removed
- Whether `~/.claude/settings.json` was reset (agent set back to `"default"`)
- Any warnings or errors from the script

Note: `/setup-agentic-scaffold` will no longer be available in other workspaces after uninstall.
