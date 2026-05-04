---
description: Scaffold the current workspace's .claude/ directory structure for the Agentic Scaffold.
---

You are executing the `/setup-agentic-scaffold` command. This command bootstraps the local agent customization surface for the current workspace. It has two layers: a deterministic script-driven layer (directories, stubs, `.gitignore`, README) and an interactive layer (unexpected-files audit and issue tracker setup). Walk through each step in plain conversation with the user.

## Step 1 — Run the deterministic scaffold script

Run the scaffold script using the canonical install path:

```bash
node "$HOME/.claude/agentic-scaffold/scaffold.mjs" init --workspace=<workspace-root>
```

This single command, idempotently and create-missing-only:

- Creates `.claude/specific-agent-instructions/` with empty stubs for every agent in the merged roster.
- Creates `.claude/specific-agent-instructions/README.md` (auto-generated index).
- Creates `.claude/epics/.gitkeep`.
- Appends `agent-artifacts/` to `.gitignore` per this contract:
  1. If `.gitignore` does not exist, create it containing `agent-artifacts/` followed by a trailing newline.
  2. If `.gitignore` exists, check whether any line (after stripping leading `/` and surrounding whitespace) equals `agent-artifacts/`. If yes, do nothing.
  3. If no matching line exists, ensure the file ends with a newline (append one if missing), then append `agent-artifacts/` followed by a trailing newline.

The script reports `created` / `exists, skipped` per file. Re-runs are safe.

`agent-artifacts/` is **not** created at scaffold time. Agents create it lazily on first write.

## Step 2 — Unexpected-files audit

Obtain the canonical expected-files roster:

```bash
node "$HOME/.claude/agentic-scaffold/scaffold.mjs" manifest
```

Compare the actual contents of `.claude/specific-agent-instructions/` against the manifest's expected roster. For each unexpected file, ask the user (in normal conversation) whether to keep or delete it. Never delete without explicit user approval.

After all audit decisions are made, refresh the README so it reflects the final folder contents:

```bash
node "$HOME/.claude/agentic-scaffold/scaffold.mjs" regen-readme --workspace=<workspace-root>
```

Kept-unexpected files appear in the generated index without a purpose suffix.

## Step 3 — Issue Tracker Setup

If `.claude/specific-agent-instructions/issue-tracker.md` is empty, run auto-detection from `git remote -v` and walk the user through the platform-specific dialog. If the user already populated the file (rare), skip this step.

### Step 3.1 — Auto-detect platform from git remote

Run `git remote -v` and inspect the `origin` fetch URL. Match against:

- **Azure DevOps HTTPS:** `https://{org}@dev.azure.com/{org}/{project}/_git/{repo}`
- **Azure DevOps SSH:** `git@ssh.dev.azure.com:v3/{org}/{project}/{repo}`
- **GitHub HTTPS:** `https://github.com/{owner}/{repo}.git`
- **GitHub SSH:** `git@github.com:{owner}/{repo}.git`

URL-decode any percent-encoded segments (e.g., `Tula%20AI` → `Tula AI`). Strip trailing `.git` from GitHub repo names.

### Step 3.2a — Azure DevOps detected

Present detected values to the user for confirmation:

> I detected an Azure DevOps remote:
> - **Organization**: {organization}
> - **Project**: {project}
> - **Repository**: {repository}
>
> I also need a couple of optional values:
> - **Default area path** — Area paths organize work items by team or product structure (e.g., `MyProject\Backend`). Leave blank to default to the project root.
> - **Default iteration path** — Iteration paths represent sprints or planning periods (e.g., `MyProject\Sprint 1`). Leave blank to default to the project root.
>
> Confirm the detected values are correct and provide area/iteration paths if desired, or type "skip" to skip issue tracker setup.

If the user confirms, write `.claude/specific-agent-instructions/issue-tracker.md` with:

```md
## Platform
azure-devops

## Connection
- Organization: {organization}
- Project: {project}
- Repository: {repository}

## Defaults
- Area path: {area_path or "not set"}
- Iteration path: {iteration_path or "not set"}

## Platform Mechanics
- **Local ID Key:** `ado_id`
- **State Translation Map:**
  - `Todo` -> ADO State: `New`
  - `Doing` -> ADO State: `Active`
  - `Done` -> ADO State: `Closed`
- **Scaffolding:** Use ADO hierarchy. Create the parent Epic/Feature, then create the child Tasks and link them (`System.LinkTypes.Hierarchy-Forward`).
- **Mapping:** Push finalized local Markdown directly into the `Description` field of the corresponding ADO item. Local feature folders live under `.claude/epics/<feature-slug>/`.
```

Then ensure `.vscode/mcp.json` exists and contains the Azure DevOps MCP server entry. If the file already exists, merge the new server entry without overwriting existing servers. If the `ado-remote-mcp` server already exists, skip.

```json
{
  "servers": {
    "ado-remote-mcp": {
      "url": "https://mcp.dev.azure.com/{organization}",
      "type": "http",
      "headers": {
        "X-MCP-Toolsets": "wit,work,search"
      }
    }
  }
}
```

Replace `{organization}` with the actual organization name.

### Step 3.2b — GitHub detected

Present detected values:

> I detected a GitHub remote:
> - **Owner**: {owner}
> - **Repository**: {repo}
>
> Optionally, provide **default labels** (comma-separated) for new issues, or leave blank.
>
> Confirm the detected values are correct, or type "skip" to skip issue tracker setup.

If the user confirms, write `.claude/specific-agent-instructions/issue-tracker.md` with:

```md
## Platform
github

## Connection
- Owner: {owner}
- Repository: {repo}

## Defaults
- Labels: {labels or "not set"}

## Platform Mechanics
- **Local ID Key:** `github_issue`
- **State Translation Map:**
  - `Todo` -> GitHub State: `open`
  - `Doing` -> GitHub State: `open`
  - `Done` -> GitHub State: `closed`
- **Scaffolding:** Create child task issues first. Then create a main "Tracking Issue" containing a Markdown checklist of the child task numbers in its body.
- **Mapping:** Push finalized local Markdown directly into the `body` field of the corresponding Tracking Issue. Local feature folders live under `.claude/epics/<feature-slug>/`. Do not use Agile terminology.
```

Then ensure `.vscode/mcp.json` exists and contains the GitHub MCP server entry. If the file already exists, merge without overwriting existing servers. If the `github` server already exists, skip.

```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "X-MCP-Toolsets": "issues,labels,projects"
      }
    }
  }
}
```

### Step 3.2c — No recognized remote (manual fallback)

Ask:

> I couldn't detect a known issue tracker platform from the git remote. Would you like to configure one manually? (Azure DevOps / GitHub / Skip)

- **Azure DevOps:** ask for organization, project, repository, area path (optional), iteration path (optional). Then write the files as in Step 3.2a.
- **GitHub:** ask for owner, repository, default labels (optional). Then write the files as in Step 3.2b.

### Skip at any step

Leave `.claude/specific-agent-instructions/issue-tracker.md` empty. The `issue-tracker` agent will return a structured error to its caller when first invoked, and the user can re-run `/setup-agentic-scaffold` or fill the file in by hand.

## Step 4 — Final report

After everything completes, return a concise report listing:

- Created files (from the script).
- Skipped existing files (from the script).
- Whether `.gitignore` was created, appended to, or already had the entry.
- Any unexpected files found and the action taken.
- Whether the issue tracker was configured and for which platform.
- If `CLAUDE.md` is absent, note: "No CLAUDE.md found. Consider creating one manually or running Claude Code's `/init` to help agents understand your project."

## Boundaries

- **Always:** Run the deterministic script first, then handle the interactive layer. Use the manifest as the single source of truth for the expected-files roster.
- **Never:** Duplicate the file roster in prose. Always read it from the script's `manifest` subcommand.
- **Never:** Overwrite an existing populated stub. Idempotency is non-negotiable.
- **Never:** Delete unexpected files without explicit user approval.
- **Never:** Create or modify `CLAUDE.md`. If absent, note it in the final report only.
- **Never:** Reference `install.mjs` or perform any install-time operations. Those belong to the `/install` command.
