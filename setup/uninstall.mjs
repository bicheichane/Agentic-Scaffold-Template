#!/usr/bin/env node
// setup/uninstall.mjs
//
// Removes all symlinks and settings written by setup/install.mjs. Only
// removes symlinks whose resolved targets live inside this repo — foreign
// symlinks and real files are left untouched.
//
// Usage:
//   node setup/uninstall.mjs [--target=<dir>] [--dry-run]
//
// Flags:
//   --target=<dir>  Directory to uninstall from (default: $HOME/.claude).
//   --dry-run       Log what would be done without making changes.
//   --help, -h      Print this usage and exit 0.
//
// Exit codes: 0 success, 1 usage error, 2 IO error.
//
// Cross-platform: pure Node 18+, no deps, no shell.

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// setup/ is one level below repo root, so resolve up one level.
const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_AGENTS_DIR = path.join(REPO_ROOT, '.claude', 'agents');
const SOURCE_SCRIPTS_DIR = path.join(REPO_ROOT, 'scripts');
const SOURCE_COMMANDS_DIR = path.join(REPO_ROOT, '.claude', 'commands');
const SOURCE_SKILLS_DIR = path.join(SOURCE_AGENTS_DIR, 'skills', 'agentic-template');
const SCAFFOLD_LINK_NAME = 'agentic-scaffold';
const SKILLS_NAMESPACE = 'agentic-template';

function parseArgs(argv) {
  const args = {
    target: path.join(os.homedir(), '.claude'),
    dryRun: false,
  };
  const positional = [];
  for (const a of argv.slice(2)) {
    if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a.startsWith('--target=')) {
      args.target = path.resolve(a.slice('--target='.length));
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
  if (positional.length > 0) {
    console.error(`unexpected argument: ${positional[0]}`);
    printUsage();
    process.exit(1);
  }
  return args;
}

function printUsage() {
  console.error('usage: uninstall.mjs [--target=<dir>] [--dry-run]');
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function lstatOrNull(p) {
  try {
    return await fs.lstat(p);
  } catch {
    return null;
  }
}

// Resolve a symlink's target to an absolute path. The target read by readlink
// may be relative — relative to the link's parent directory.
async function resolveSymlinkTarget(linkPath) {
  const raw = await fs.readlink(linkPath);
  if (path.isAbsolute(raw)) return path.resolve(raw);
  return path.resolve(path.dirname(linkPath), raw);
}

function isInsideRepo(p) {
  if (!p) return false;
  const rel = path.relative(REPO_ROOT, p);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

// Remove a symlink only if it points into the repo. Never deletes real files.
async function removeOurSymlink(linkPath, dryRun) {
  const st = await lstatOrNull(linkPath);
  if (!st) {
    console.log(`not present:      ${linkPath}`);
    return false;
  }
  if (!st.isSymbolicLink()) {
    console.log(`real file, kept:  ${linkPath}`);
    return false;
  }
  let resolved;
  try {
    resolved = await resolveSymlinkTarget(linkPath);
  } catch {
    console.log(`unreadable, kept: ${linkPath}`);
    return false;
  }
  if (!isInsideRepo(resolved)) {
    console.log(`foreign, kept:    ${linkPath} -> ${resolved}`);
    return false;
  }
  if (dryRun) {
    console.log(`would remove:     ${linkPath}`);
    return true;
  }
  await fs.unlink(linkPath);
  console.log(`removed:          ${linkPath}`);
  return true;
}

// Walk a directory and remove all symlinks that resolve into this repo.
async function removeRepoSymlinksFromDir(dir, label, dryRun) {
  if (!(await exists(dir))) {
    console.log(`no ${label} dir:    ${dir}`);
    return;
  }
  const entries = await fs.readdir(dir);
  for (const name of entries.sort()) {
    const linkPath = path.join(dir, name);
    const st = await lstatOrNull(linkPath);
    if (!st || !st.isSymbolicLink()) continue;
    let resolved;
    try {
      resolved = await resolveSymlinkTarget(linkPath);
    } catch {
      continue;
    }
    if (!isInsideRepo(resolved)) continue;
    if (dryRun) {
      console.log(`would remove:     ${linkPath}`);
    } else {
      await fs.unlink(linkPath);
      console.log(`removed:          ${linkPath}`);
    }
  }
}

// Reset the default agent in settings.json to "default" if it was set to
// "planner" by the install script. Refuses to touch a value we didn't write.
async function resetDefaultAgent(settingsPath, dryRun) {
  if (!(await exists(settingsPath))) {
    console.log(`no settings:      ${settingsPath}`);
    return false;
  }
  let raw;
  try {
    raw = await fs.readFile(settingsPath, 'utf8');
  } catch {
    return false;
  }
  let settings;
  try {
    settings = JSON.parse(raw);
  } catch {
    console.log(`unparseable:      ${settingsPath}, skipped`);
    return false;
  }
  if (settings.agent !== 'planner') {
    console.log(`agent not ours:   ${settingsPath} -> agent = ${JSON.stringify(settings.agent)}`);
    return false;
  }
  if (dryRun) {
    console.log(`would reset:      ${settingsPath} -> agent = "default"`);
    return true;
  }
  settings.agent = 'default';
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, '\t') + '\n');
  console.log(`reset:            ${settingsPath} -> agent = "default"`);
  return true;
}

async function main() {
  const args = parseArgs(process.argv);
  const { target, dryRun } = args;

  const agentsTargetDir = path.join(target, 'agents');
  const commandsTargetDir = path.join(target, 'commands');
  const scaffoldLinkPath = path.join(target, SCAFFOLD_LINK_NAME);

  try {
    // 1. Remove per-file agent symlinks (walk dir, remove any pointing into repo).
    await removeRepoSymlinksFromDir(agentsTargetDir, 'agents', dryRun);

    // 2. Remove the scaffold directory symlink (~/.claude/agentic-scaffold/).
    await removeOurSymlink(scaffoldLinkPath, dryRun);

    // 3. Remove the skills namespace symlink (~/.claude/agents/skills/agentic-template/).
    const skillsLinkPath = path.join(agentsTargetDir, 'skills', SKILLS_NAMESPACE);
    await removeOurSymlink(skillsLinkPath, dryRun);

    // 4. Remove per-file command symlinks (same shape as agents).
    await removeRepoSymlinksFromDir(commandsTargetDir, 'commands', dryRun);

    // 5. Reset the default agent in settings.json back to "default".
    const settingsPath = path.join(target, 'settings.json');
    await resetDefaultAgent(settingsPath, dryRun);
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
