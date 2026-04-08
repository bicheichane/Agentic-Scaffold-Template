---
agent: agent
description: Register this repository's agents in VS Code user settings so they are available in all workspaces.
---

Invoke the `generic_agent` sub-agent with the following instructions verbatim:

---

## Task: Initialize Scaffold Environment

Perform the following steps in order.

### Step 1 — Install Required Extensions

Check whether the `jraylan.seamless-agent` VS Code extension is installed:

```
code-insiders --list-extensions | grep -i seamless-agent
```

If not found, try the stable edition:

```
code --list-extensions | grep -i seamless-agent
```

If not installed in either, install it:

- **Insiders**: `code-insiders --install-extension jraylan.seamless-agent`
- **Stable**: `code --install-extension jraylan.seamless-agent`

Use whichever CLI (`code-insiders` or `code`) is available. Prefer Insiders if both exist.

### Step 2 — Register Global Agent Source

Register this repository's `.github/agents` folder in the VS Code user settings so that the agents defined here are available in every workspace.

#### Discover the scaffold repository path

Find the absolute path to this repo by searching for `workspace-scaffold-agent.agent.md`:

- **macOS**: `mdfind -name workspace-scaffold-agent.agent.md`
- **Linux**: `find ~ -maxdepth 6 -name workspace-scaffold-agent.agent.md -type f 2>/dev/null | head -1`
- **Windows (PowerShell)**: `Get-ChildItem -Path $HOME -Recurse -Depth 6 -Filter workspace-scaffold-agent.agent.md -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName`

The repo root is two directories above the found file (strip `.github/agents/<filename>`). The agents path is `<repo-root>/.github/agents`.

If the search returns nothing, **ask the user** for the path to the scaffold repository root.

#### Convert to `~/`-relative path

VS Code's `chat.agentFilesLocations` only accepts **relative paths** (resolved from the workspace root) or **`~/`-prefixed paths** (resolved from the user's home directory). Absolute paths (e.g., `/Users/...`, `C:\Users\...`) and backslash separators are rejected.

After discovering the absolute agents path, convert it to a `~/`-relative form:

- Determine the user's home directory (`$HOME` on macOS/Linux, `$env:USERPROFILE` on Windows).
- Strip the home directory prefix from the absolute path and prepend `~/`.
- Example: `/Users/bernardopinho/Documents/Repos/MyRepo/.github/agents` → `~/Documents/Repos/MyRepo/.github/agents`

If the agents path is not under the user's home directory, **ask the user** how they'd like to reference it — the path cannot be registered as-is.

#### Locate the VS Code user settings file

Determine the OS and VS Code edition (Insiders or stable):

- **macOS**: `~/Library/Application Support/Code - Insiders/User/settings.json` or `~/Library/Application Support/Code/User/settings.json`
- **Linux**: `~/.config/Code - Insiders/User/settings.json` or `~/.config/Code/User/settings.json`
- **Windows**: `%APPDATA%/Code - Insiders/User/settings.json` or `%APPDATA%/Code/User/settings.json`

Try the Insiders path first; fall back to stable if it does not exist.

#### Check and update `chat.agentFilesLocations`

1. Read the VS Code user settings file.
2. Check whether the `~/`-relative agents path is already a key in `chat.agentFilesLocations`.
3. If it is present, skip — already registered. Report to the user and finish.
4. If it is absent, **ask the user for confirmation** before making changes. Explain that you want to add the `~/`-relative path to `chat.agentFilesLocations` in their VS Code user settings so agents from this scaffold repo are available in all workspaces. Only proceed if the user explicitly approves.
5. Once approved, add the `~/`-relative path with value `true`. Preserve all existing entries.
6. If `chat.agentFilesLocations` does not exist in settings at all, create it with the new entry only.
7. Write the updated settings back, preserving formatting and all other settings.
8. Never remove or modify existing entries in `chat.agentFilesLocations`.

### Step 3 — Report

After completing all steps, report:
- Whether the `jraylan.seamless-agent` extension was already installed or was installed now.
- Whether the agent source was already registered or was added.
- The exact `~/`-relative path that was registered.
- Remind the user to reload VS Code if any settings or extensions were changed.
