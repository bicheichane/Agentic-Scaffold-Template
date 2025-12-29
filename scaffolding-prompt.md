# Scaffolding Prompt

Use this prompt to start a conversation with the Scaffolding Agent. Copy and paste it into a GitHub Copilot Chat window.

---

## The Prompt

```
I want to scaffold an agentic workflow based on a new project's requirements. 

# Project Overview
<!-- Brief description of what the project does and what problem it solves -->


# Tech Stack
<!-- Languages, frameworks, libraries, and tools used -->


# Project Structure
<!-- Key directories and their purposes (source code, tests, docs, etc.) -->


# Business Domain
<!-- What problem does this solve? What are the key domain concepts? -->


# Testing Strategy
<!-- What test frameworks do you use? Unit tests, integration tests, E2E? Where are they located? -->


# Documentation Conventions
<!-- Where do you keep docs? Any existing documentation files? -->


---

Please take a look at the existing agentic template structure in the Template-Generic folder, analyze my project information above, and ask me any clarifying or probing questions before starting the scaffolding work.

I understand you will:
1. Ask me questions until you fully understand my project structure, patterns, and requirements
2. Present a summary for my confirmation
3. Automatically create the .github/ folder with fully populated agent files
```

---

## What Happens Next

After you submit this prompt, the **Scaffolding Agent** will:

1. **Analyze** your provided information
2. **Ask probing questions** for each section to fill in gaps (tech stack details, directory structure, coding patterns, testing conventions, etc.)
3. **Present a summary** of everything it gathered for your confirmation
4. **Create all files** in a dedicated output folder:
   ```
   <YourProjectName>/.github/
   ├── copilot-instructions.md
   └── agents/
       ├── coder-agent.md
       ├── docs-agent.md
       ├── generic-agent.md
       ├── planner-agent.md
       └── qa-agent.md
   ```
5. **Instruct you to copy** the `<YourProjectName>/.github/` folder to your actual project

The output is placed in a separate folder to avoid overwriting the template files.

---

## Tips for Best Results

- **Be detailed upfront**: The more information you provide in the initial prompt, the fewer follow-up questions the agent needs to ask
- **Don't worry about format**: The agent will ask clarifying questions if anything is unclear
- **Leave sections blank if unsure**: The agent will probe for that information
- **Mention any special patterns**: If you have unique architectural patterns or coding conventions, mention them so the agent can incorporate them into the Development Guidelines
