# Agentic Workflow Template

This template provides a scaffolding structure for setting up an agentic workflow using GitHub Copilot agents. It defines a **Lead Orchestrator** that delegates tasks to specialized **Sub-Agents** following structured pipelines.

---

## Prerequisites

### 🔌 Seamless Agent VSCode Extension (Required)

This agentic workflow **requires** the [Seamless Agent](https://marketplace.visualstudio.com/items?itemName=jraylan.seamless-agent) VSCode extension to function.
It provides the `ask_user` tool for more efficient communication between you and the agents.

**Installation:**
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Seamless Agent"
4. Install the extension by **jraylan**
5. Reload VS Code if prompted

**Without this extension, agents should still function, but with reduced efficiency.**

---

## Quick Start

The scaffolding process uses a **two-step workflow** with specialized agents:

### Step 1: Use the Scaffolding Prompt

Open [scaffolding-prompt.md](scaffolding-prompt.md), fill it out appropriately, and then paste it into a GitHub Copilot Chat window on this workspace.

### Step 2: Requirements Gathering (Scaffold Requirements Agent)

The **Scaffold Requirements Agent** (`scaffold_requirements_agent`) will:
1. Analyze your project information
2. Ask probing questions about your tech stack, directory structure, coding patterns, and testing conventions
3. Gather enough information to fill in ALL placeholders
4. Present a summary for your confirmation
5. Create `ScaffoldingDocs/agent-requirements.md` with all gathered information

### Step 3: File Creation (Scaffold Writer Agent)

Once requirements are gathered, the **Scaffold Writer Agent** (`scaffold_writer_agent`) will:
1. Read the requirements file from `ScaffoldingDocs/agent-requirements.md`
2. Use templates from `Template-Generic/` as the base
3. Replace all placeholders with your project's values
4. Create the files in a dedicated output folder: `<YourProjectName>/.github/`

### Step 4: Copy to Your Project

Copy the generated `<YourProjectName>/.github/` folder to your actual project's `.github/` directory.

**You don't need to:**
- ❌ Copy template files manually
- ❌ Fill in placeholders yourself
- ❌ Edit the template files directly

The two-step scaffolding workflow handles everything except the final copy to your project.

---

## Template Structure

### Scaffolding Agents (Two-Step Workflow)

The scaffolding process uses two specialized agents:

#### Scaffold Requirements Agent (`ScaffoldingDocs/scaffold-requirements-agent.md`)
The **Requirements Agent** handles the first step:
- Gathers comprehensive information about your project
- Asks probing questions until it understands your codebase
- Creates `ScaffoldingDocs/agent-requirements.md` with all gathered information

#### Scaffold Writer Agent (`ScaffoldingDocs/scaffold-writer-agent.md`)
The **Writer Agent** handles the second step:
- Reads the requirements file created by the Requirements Agent
- Uses templates from `Template-Generic/` as the base
- Replaces all placeholders with your project's values
- Automatically creates and populates all agent files

### Orchestrator (`copilot-instructions.md`)
The **Lead Orchestrator** is the main entry point after setup. It:
- Analyzes user requests
- Routes to the appropriate sub-agent
- Enforces development pipelines (Feature, Bugfix, etc.)
- Uses `ask_user` liberally for clarification and confirmation

### Sub-Agents (`agents/`)

| Agent | Role | Primary Responsibility |
|-------|------|------------------------|
| `planner_agent` | Architect | Analyzes requests, creates implementation plans |
| `coder_agent` | Engineer | Implements code changes based on plans |
| `docs_agent` | Auditor | Verifies implementation, updates documentation |
| `qa_agent` | SDET | Writes and runs tests |
| `generic_agent` | Secretary | General-purpose assistant for miscellaneous tasks |

---

## Pipelines

### Feature Pipeline (Standard)
1. **Plan:** `planner_agent` drafts `{{IMPLEMENTATION_PLAN_DOC}}`
2. **Code:** `coder_agent` implements changes
3. **Audit:** `docs_agent` verifies implementation matches plan
4. **Test:** `qa_agent` writes and runs tests
5. **Finalize:** `docs_agent` documents test infrastructure
6. **Confirm:** Use `ask_user` to confirm completion

### Bugfix Pipeline
1. **Analyze:** (Optional) `planner_agent` if design changes needed
2. **Patch:** `coder_agent` implements fix
3. **Verify:** `qa_agent` runs tests

---

## Core Principles

### 🗣️ Communication is Key
All agents use the `ask_user` tool liberally:
- **Ambiguity:** Ask before guessing
- **Blockers:** Ask for direction when stuck
- **Confirmation:** Ask before marking tasks complete
- **Questions:** NEVER ask in plain text—ALWAYS use `ask_user`

### 📋 Plan-Driven Development
- The `planner_agent` creates the implementation plan
- Other agents follow their respective sub-plans
- Divergences are documented in `{{AGENT_FEEDBACK_DIR}}`

### 🔒 Strict Boundaries
Each agent has clear boundaries:
- Coder writes code, not tests or docs
- QA writes tests, not production code
- Docs updates documentation, not code
- Planner creates plans, not implementations

---

## Placeholder Reference

The Scaffolding Agent will gather information to fill all of these automatically. This reference is provided for transparency and manual adjustments if needed.

<details>
<summary>Click to expand placeholder reference</summary>

### Core Project Placeholders

| Placeholder | Description | Example Value |
|-------------|-------------|---------------|
| `{{PROJECT_NAME}}` | The name of your project | `MyAwesomeApp`, `E-Commerce Platform` |
| `{{TECH_STACK}}` | Primary technologies used | `.NET 10, C#`, `Node.js, TypeScript`, `Python, FastAPI` |
| `{{TEST_FRAMEWORK}}` | Testing framework(s) | `xUnit`, `Jest`, `pytest` |
| `{{ASSERTION_LIBRARY}}` | Assertion library (if applicable) | `FluentAssertions`, `Chai`, `pytest assertions` |

### Directory Structure Placeholders

| Placeholder | Description | Example Value |
|-------------|-------------|---------------|
| `{{SOURCE_DIR}}` | Main source code directory | `src/`, `app/` |
| `{{MODELS_DIR}}` | State/models directory (if separate) | `models/`, `src/models/` |
| `{{TESTS_DIR}}` | Test code directory | `tests/`, `__tests__/` |
| `{{DOCS_DIR}}` | Documentation directory | `docs/`, `Documentation/` |

### Documentation File Placeholders

| Placeholder | Description | Suggested Default |
|-------------|-------------|-------------------|
| `{{ARCHITECTURE_DOC}}` | Technical architecture documentation | `architecture.md` |
| `{{BUSINESS_RULES_DOC}}` | Business rules/requirements documentation | `business-rules.md` |
| `{{TEST_SPECS_DOC}}` | Test specifications/scenarios documentation | `test-specs.md` |
| `{{IMPLEMENTATION_PLAN_DOC}}` | Implementation plan document | `implementation-plan.md` |
| `{{IMPLEMENTATION_PLAN_CODER_DOC}}` | Coder-specific implementation plan | `implementation-plan-coder.md` |
| `{{IMPLEMENTATION_PLAN_TESTS_DOC}}` | Tests-specific implementation plan | `implementation-plan-tests.md` |
| `{{IMPLEMENTATION_PLAN_DOCS_DOC}}` | Docs-specific implementation plan | `implementation-plan-docs.md` |

### Agent Feedback Directory Placeholders

| Placeholder | Description | Suggested Default |
|-------------|-------------|-------------------|
| `{{AGENT_FEEDBACK_DIR}}` | Directory for agent Q&A and divergences | `AgentFeedback/` |
| `{{CODER_FEEDBACK_DIR}}` | Coder agent feedback subdirectory | `AgentFeedback/Coder/` |
| `{{QA_FEEDBACK_DIR}}` | QA agent feedback subdirectory | `AgentFeedback/QA/` |
| `{{DOCS_FEEDBACK_DIR}}` | Docs agent feedback subdirectory | `AgentFeedback/Docs/` |
| `{{PLANNER_FEEDBACK_DIR}}` | Planner agent feedback subdirectory | `AgentFeedback/Planner/` |

### Domain-Specific Content

| Placeholder | Description |
|-------------|-------------|
| `{{DOMAIN_CONTEXT}}` | Project purpose and core concepts |
| `{{DEVELOPMENT_GUIDELINES}}` | Project-specific coding patterns and conventions |
| `{{TESTING_GUIDELINES}}` | Project-specific testing patterns and conventions |

</details>

---

## Customization Tips

1. **Add domain-specific sections** to the coder and QA agents for your project's patterns
2. **Extend the pipelines** if your workflow has additional steps
3. **Add new agents** if you have specialized roles (e.g., `security-agent`, `perf-agent`)

---

## Post-Scaffolding Checklist

After the Scaffolding Agent completes, verify:
- [ ] All agent files were created in `.github/`
- [ ] Domain-specific guidance looks correct in `coder-agent.md`
- [ ] Testing guidelines look correct in `qa-agent.md`
- [ ] The agent roster table in `copilot-instructions.md` matches your directory structure
- [ ] Consider creating your documentation files if they don't exist yet
