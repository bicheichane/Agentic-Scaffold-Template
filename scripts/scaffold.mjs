#!/usr/bin/env node
// scripts/scaffold.mjs
//
// Deterministic part of workspace-scaffold. Creates the .claude/
// directory structure, override stubs, .gitkeep for epics, and the
// .gitignore entry for agent-artifacts. Does not touch CLAUDE.md or
// .vscode/mcp.json — those are interactive and stay in the agent.
//
// Subcommands:
//   init          Create dirs, stubs, .gitkeep, .gitignore entry, regen README.
//   regen-readme  Regen .claude/specific-agent-instructions/README.md from folder contents.
//   manifest      Print canonical expected-roster JSON to stdout.
//
// Flags:
//   --workspace=<path>  Target workspace root (default: cwd).
//   --dry-run           Log actions without writing.
//
// Exit codes: 0 success, 1 usage error, 2 IO error.
//
// Cross-platform: pure Node 18+, no deps, no shell.

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

const STUBS = [
  { name: 'generic.md', purpose: '' },
  { name: 'planner.md', purpose: '' },
  { name: 'coder.md', purpose: '' },
  { name: 'qa.md', purpose: '' },
  { name: 'docs.md', purpose: '' },
  { name: 'reviewer.md', purpose: '' },
  { name: 'issue-tracker.md', purpose: 'platform config (azure-devops, github, etc.)' },
  { name: 'worktree-manager.md', purpose: 'environment-specific worktree base directory' },
];

const WORKTREE_MANAGER_TEMPLATE = `<!--
  Environment-specific config for worktree-manager.

  Fill in your local worktree base directory below. The agent reads this on
  startup; if this file is empty or still in stub form, the agent will
  surface the gap to you in the conversation rather than guessing a path.

  Example:

      worktree-base-dir: /Users/yourname/Documents/Worktrees
-->
`;

const README_HEADER = `# Specific Agent Instructions

These files are optional local extensions for the global agent definitions in \`~/.claude/agents/\`.

Use this folder only for repository-specific guidance.
Leave files empty when no extra local guidance is needed.
Do not create agent definition files here.

Files:
`;

const GITIGNORE_ENTRY = '.claude/agent-artifacts/';

function parseArgs(argv) {
  const args = { command: null, workspace: process.cwd(), dryRun: false };
  const positional = [];
  for (const a of argv.slice(2)) {
    if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a.startsWith('--workspace=')) {
      args.workspace = path.resolve(a.slice('--workspace='.length));
    } else if (a === '--help' || a === '-h') {
      printUsage();
      process.exit(0);
    } else if (a.startsWith('--')) {
      console.error(`unknown flag: ${a}`);
      printUsage();
      process.exit(1);
    } else {
      positional.push(a);
    }
  }
  if (positional.length !== 1) {
    printUsage();
    process.exit(1);
  }
  args.command = positional[0];
  return args;
}

function printUsage() {
  console.error('usage: scaffold.mjs <init|regen-readme|manifest> [--workspace=<path>] [--dry-run]');
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p, dryRun) {
  if (await exists(p)) return false;
  if (dryRun) {
    console.log(`would create dir: ${p}`);
    return true;
  }
  await fs.mkdir(p, { recursive: true });
  console.log(`created dir: ${p}`);
  return true;
}

async function createIfMissing(p, contents, dryRun) {
  if (await exists(p)) {
    console.log(`exists, skipped:  ${p}`);
    return false;
  }
  if (dryRun) {
    console.log(`would create:     ${p}`);
    return true;
  }
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, contents);
  console.log(`created:          ${p}`);
  return true;
}

async function appendGitignoreEntry(workspace, dryRun) {
  const gitignorePath = path.join(workspace, '.gitignore');
  if (!(await exists(gitignorePath))) {
    if (dryRun) {
      console.log(`would create .gitignore with: ${GITIGNORE_ENTRY}`);
      return;
    }
    await fs.writeFile(gitignorePath, GITIGNORE_ENTRY + '\n');
    console.log(`created .gitignore with entry: ${GITIGNORE_ENTRY}`);
    return;
  }
  const current = await fs.readFile(gitignorePath, 'utf8');
  const matches = current.split('\n').some((line) => {
    const trimmed = line.trim().replace(/^\//, '');
    return trimmed === GITIGNORE_ENTRY;
  });
  if (matches) {
    console.log(`.gitignore already contains ${GITIGNORE_ENTRY}, skipped`);
    return;
  }
  if (dryRun) {
    console.log(`would append to .gitignore: ${GITIGNORE_ENTRY}`);
    return;
  }
  const needsLeadingNewline = current.length > 0 && !current.endsWith('\n');
  const append = (needsLeadingNewline ? '\n' : '') + GITIGNORE_ENTRY + '\n';
  await fs.appendFile(gitignorePath, append);
  console.log(`appended to .gitignore: ${GITIGNORE_ENTRY}`);
}

async function regenReadme(workspace, dryRun) {
  const dir = path.join(workspace, '.claude', 'specific-agent-instructions');
  const readmePath = path.join(dir, 'README.md');
  const dirPresent = await exists(dir);

  if (!dirPresent && !dryRun) {
    console.error(`directory missing, cannot regen README: ${dir}`);
    process.exit(2);
  }

  // In dry-run with a missing dir (e.g., during `init --dry-run`), assume the
  // canonical roster from STUBS as the projected folder contents.
  const mdFiles = dirPresent
    ? (await fs.readdir(dir)).filter((f) => f.endsWith('.md') && f !== 'README.md').sort()
    : STUBS.map((s) => s.name).sort();

  const purposeMap = new Map(STUBS.map((s) => [s.name, s.purpose]));
  const lines = mdFiles.map((f) => {
    const purpose = purposeMap.get(f);
    return purpose ? `- \`${f}\` — ${purpose}` : `- \`${f}\``;
  });
  const content = README_HEADER + (lines.length > 0 ? lines.join('\n') + '\n' : '');

  if (dryRun) {
    console.log(`would write README: ${readmePath}`);
    return;
  }
  await fs.writeFile(readmePath, content);
  console.log(`wrote README:     ${readmePath}`);
}

async function cmdInit(workspace, dryRun) {
  const claudeDir = path.join(workspace, '.claude');
  const saiDir = path.join(claudeDir, 'specific-agent-instructions');
  const epicsDir = path.join(claudeDir, 'epics');

  await ensureDir(saiDir, dryRun);
  await ensureDir(epicsDir, dryRun);

  for (const stub of STUBS) {
    const target = path.join(saiDir, stub.name);
    const contents = stub.name === 'worktree-manager.md' ? WORKTREE_MANAGER_TEMPLATE : '';
    await createIfMissing(target, contents, dryRun);
  }

  await createIfMissing(path.join(epicsDir, '.gitkeep'), '', dryRun);
  await appendGitignoreEntry(workspace, dryRun);
  await regenReadme(workspace, dryRun);
}

function cmdManifest() {
  const manifest = {
    directories: ['.claude/specific-agent-instructions/', '.claude/epics/'],
    overrideStubs: STUBS.map((s) => ({
      path: `.claude/specific-agent-instructions/${s.name}`,
      purpose: s.purpose,
    })),
    generatedFiles: [
      { path: '.claude/specific-agent-instructions/README.md', purpose: 'auto-generated index of override stubs' },
      { path: '.claude/epics/.gitkeep', purpose: 'placeholder for committed epics directory' },
    ],
    gitignoreEntry: GITIGNORE_ENTRY,
  };
  process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
}

async function main() {
  const args = parseArgs(process.argv);
  try {
    switch (args.command) {
      case 'init':
        await cmdInit(args.workspace, args.dryRun);
        break;
      case 'regen-readme':
        await regenReadme(args.workspace, args.dryRun);
        break;
      case 'manifest':
        cmdManifest();
        break;
      default:
        console.error(`unknown command: ${args.command}`);
        printUsage();
        process.exit(1);
    }
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(2);
  }
}

main();
