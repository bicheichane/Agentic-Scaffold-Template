# Agentic Workflow Template

A global agent repository for VS Code. Reference it once in your user settings and the agents are available in every workspace.

## Prerequisites

- [Seamless Agent](https://marketplace.visualstudio.com/items?itemName=jraylan.seamless-agent) VS Code extension (agents rely on its `askUser` tool for user interaction)

## Setup

Run the **Initialize** prompt (`.github/prompts/initialize.prompt.md`). It will:

1. Verify the Seamless Agent extension is installed.
2. Register this repository's `.github/agents/` folder in `chat.agentFilesLocations` in your VS Code user settings.
3. Report what was done and remind you to reload VS Code if needed.

After that, the agents defined here are available in every workspace.

## Usage

Start a conversation with **`starter-agent`**. It routes to sub-agents on request and can describe the available roster if you ask for help.

In a new workspace, run `workspace_scaffold_agent` (via `starter-agent`) first. It creates the local instruction stubs that other agents read on startup.

## Agents

| Agent | Entry | Purpose |
|-------|-------|---------|
| `starter-agent` | User-invocable | Routes to sub-agents. Ask it for help to see the full roster. |
| `generic_agent` | Via starter | General-purpose assistant. Can spawn 3 parallel adversarial reviewers on demand. |
| `reviewer-user` | Via starter | Interactive adversarial reviewer — the user drives the conversation. |
| `reviewer-gpt5.4` | Via generic | Autonomous adversarial reviewer (non-interactive). |
| `reviewer-opus4.6` | Via generic | Autonomous adversarial reviewer (non-interactive). |
| `reviewer-gem3.1` | Via generic | Autonomous adversarial reviewer (non-interactive). |
| `workspace_scaffold_agent` | Via starter | Creates missing local workspace instruction stubs. |
| `worktree_manager` | Via starter | Manages git worktrees and opens VS Code Insiders on them. |

## Workspace Scaffold

The scaffold is **create-missing-only** and targets the active workspace. When files are missing, it creates:

| File | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Empty — workspace-level Copilot instructions |
| `.github/specific-agent-instructions/README.md` | Explains the folder's purpose |
| `.github/specific-agent-instructions/generic-agent.md` | Local guidance for the generic agent |
| `.github/specific-agent-instructions/reviewer.md` | Shared by all reviewer agents |

Rules:
- Existing files are always skipped, even when empty.
- The scaffold never creates local `.github/agents/` files — agent definitions live here, globally.
- The scaffold never overwrites, deletes, or renames existing files.

## Repository Layout

```
.github/
  agents/              Global agent definitions (registered via VS Code settings)
  prompts/             Reusable prompts (e.g., initialize.prompt.md)
  copilot-instructions.md   Empty — intentional for this repo
Workspace-Scaffold/    Fixture used by workspace_scaffold_agent as its source
docs/                  Working artifacts (review reports, etc.)
```
