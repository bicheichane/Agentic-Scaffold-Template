#!/usr/bin/env node
// scripts/install.mjs
//
// Wires this meta-template repo into the user's ~/.claude/ via symlinks so
// that pulling new commits in the repo auto-propagates to Claude Code.
//
// Four kinds of links:
//   1. Per-file: <repo>/.claude/agents/*.md        ->  ~/.claude/agents/<basename>
//      (per-file because ~/.claude/agents/ may already host unrelated agents)
//   2. Directory: <repo>/scripts/                  ->  ~/.claude/agentic-scaffold/
//      (one link, so future scripts/ additions auto-publish)
//   3. Per-file: <repo>/.claude/commands/*.md      ->  ~/.claude/commands/<basename>
//      (per-file because ~/.claude/commands/ may already host unrelated commands)
//   4. Directory: <repo>/.claude/agents/skills/agentic-template/  ->  ~/.claude/agents/skills/agentic-template/
//      (one link for the framework namespace, so future skills/scopes auto-publish)
//
// Subcommands:
//   install    Create both kinds of symlinks.
//   uninstall  Remove only links this script created (target must resolve into repo).
//   status     Read-only report of current install state.
//
// Flags:
//   --target=<dir>  Override ~/.claude/ (default: $HOME/.claude). Used in tests.
//   --dry-run       Log actions without writing.
//   --force         Replace symlinks pointing elsewhere. Never overwrites real files.
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
const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_AGENTS_DIR = path.join(REPO_ROOT, '.claude', 'agents');
const SOURCE_SCRIPTS_DIR = path.join(REPO_ROOT, 'scripts');
const SOURCE_COMMANDS_DIR = path.join(REPO_ROOT, '.claude', 'commands');
const SOURCE_SKILLS_DIR = path.join(SOURCE_AGENTS_DIR, 'skills', 'agentic-template');
const SCAFFOLD_LINK_NAME = 'agentic-scaffold';
const SKILLS_NAMESPACE = 'agentic-template';
const AGENT_FILE_SUFFIX = '.md';
const COMMAND_FILE_SUFFIX = '.md';

function parseArgs(argv) {
  const args = {
    command: null,
    target: path.join(os.homedir(), '.claude'),
    dryRun: false,
    force: false,
  };
  const positional = [];
  for (const a of argv.slice(2)) {
    if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--force') {
      args.force = true;
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
  if (positional.length !== 1) {
    printUsage();
    process.exit(1);
  }
  args.command = positional[0];
  return args;
}

function printUsage() {
  console.error('usage: install.mjs <install|uninstall|status> [--target=<dir>] [--dry-run] [--force]');
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

// Classify the existing state at `linkPath` against expected source `sourcePath`.
// Returns one of: 'missing' | 'correct' | 'wrong-symlink' | 'real'.
// For 'wrong-symlink' the resolved foreign target is included.
async function classify(linkPath, sourcePath) {
  const st = await lstatOrNull(linkPath);
  if (!st) return { kind: 'missing' };
  if (!st.isSymbolicLink()) return { kind: 'real' };
  let resolved;
  try {
    resolved = await resolveSymlinkTarget(linkPath);
  } catch {
    // Broken symlink we can still readlink-target-compare loosely; treat as wrong.
    return { kind: 'wrong-symlink', resolved: null };
  }
  if (resolved === path.resolve(sourcePath)) return { kind: 'correct' };
  return { kind: 'wrong-symlink', resolved };
}

function isInsideRepo(p) {
  if (!p) return false;
  const rel = path.relative(REPO_ROOT, p);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

// On Windows, directory symlinks need 'junction' to avoid requiring admin.
function symlinkType(sourcePath, isDir) {
  if (process.platform !== 'win32') return undefined;
  return isDir ? 'junction' : 'file';
}

// Probe whether file symlinks are creatable on this system. On Windows without
// Developer Mode / admin this fails with EPERM.
async function probeFileSymlinkSupport(targetDir, dryRun) {
  if (process.platform !== 'win32') return;
  const probeSource = path.join(REPO_ROOT, 'scripts', 'install.mjs');
  const probeLink = path.join(targetDir, `.install-probe-${process.pid}`);
  try {
    if (dryRun) return;
    await fs.mkdir(targetDir, { recursive: true });
    await fs.symlink(probeSource, probeLink, 'file');
    await fs.unlink(probeLink);
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      console.error(
        'error: cannot create file symlinks on this system.\n' +
          'On Windows, enable Developer Mode or run as Administrator.\n' +
          'See: https://learn.microsoft.com/windows/uwp/get-started/enable-your-device-for-development'
      );
      process.exit(2);
    }
    throw err;
  }
}

async function listSourceAgents() {
  if (!(await exists(SOURCE_AGENTS_DIR))) return [];
  const entries = await fs.readdir(SOURCE_AGENTS_DIR);
  return entries.filter((f) => f.endsWith(AGENT_FILE_SUFFIX)).sort();
}

async function listSourceCommands() {
  if (!(await exists(SOURCE_COMMANDS_DIR))) return [];
  const entries = await fs.readdir(SOURCE_COMMANDS_DIR);
  return entries.filter((f) => f.endsWith(COMMAND_FILE_SUFFIX)).sort();
}

// Create a symlink from `linkPath` -> `sourcePath`. Returns true if created/changed.
async function createSymlink(linkPath, sourcePath, isDir, { dryRun, force }) {
  const state = await classify(linkPath, sourcePath);
  switch (state.kind) {
    case 'correct':
      console.log(`already linked:   ${linkPath}`);
      return false;
    case 'real':
      console.error(
        `error: real file or directory exists at ${linkPath}\n` +
          '  refusing to overwrite user data; remove or move it manually and retry'
      );
      process.exit(2);
      return false;
    case 'wrong-symlink': {
      if (!force) {
        console.error(
          `error: symlink at ${linkPath} points elsewhere\n` +
            `  current target: ${state.resolved ?? '<unreadable>'}\n` +
            '  re-run with --force to replace'
        );
        process.exit(2);
      }
      if (dryRun) {
        console.log(`would replace:    ${linkPath} -> ${sourcePath}`);
        return true;
      }
      await fs.unlink(linkPath);
      await fs.mkdir(path.dirname(linkPath), { recursive: true });
      await fs.symlink(sourcePath, linkPath, symlinkType(sourcePath, isDir));
      console.log(`replaced:         ${linkPath} -> ${sourcePath}`);
      return true;
    }
    case 'missing': {
      if (dryRun) {
        console.log(`would create:     ${linkPath} -> ${sourcePath}`);
        return true;
      }
      await fs.mkdir(path.dirname(linkPath), { recursive: true });
      await fs.symlink(sourcePath, linkPath, symlinkType(sourcePath, isDir));
      console.log(`created:          ${linkPath} -> ${sourcePath}`);
      return true;
    }
  }
}

async function ensureDefaultAgent(settingsPath, dryRun) {
  let settings = {};
  if (await exists(settingsPath)) {
    const raw = await fs.readFile(settingsPath, 'utf8');
    try {
      settings = JSON.parse(raw);
    } catch (err) {
      console.error(`warning: could not parse ${settingsPath}: ${err.message}`);
      console.error('  skipping default-agent configuration to avoid data loss');
      return false;
    }
  }
  if (settings.agent === 'planner') {
    console.log(`already set:      ${settingsPath} -> agent = "planner"`);
    return false;
  }
  if (dryRun) {
    console.log(`would set:        ${settingsPath} -> agent = "planner"`);
    return true;
  }
  settings.agent = 'planner';
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, '\t') + '\n');
  console.log(`set:              ${settingsPath} -> agent = "planner"`);
  return true;
}

async function removeDefaultAgent(settingsPath, dryRun) {
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
    console.log(`would remove:     ${settingsPath} -> agent key`);
    return true;
  }
  delete settings.agent;
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, '\t') + '\n');
  console.log(`removed:          ${settingsPath} -> agent key`);
  return true;
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

async function cmdInstall(target, dryRun, force) {
  const agentsTargetDir = path.join(target, 'agents');
  const commandsTargetDir = path.join(target, 'commands');
  const scaffoldLinkPath = path.join(target, SCAFFOLD_LINK_NAME);

  await probeFileSymlinkSupport(agentsTargetDir, dryRun);

  // Clean up dangling symlinks that pointed into our repo (handles agent renames/deletions).
  if (await exists(agentsTargetDir)) {
    for (const entry of await fs.readdir(agentsTargetDir)) {
      const entryPath = path.join(agentsTargetDir, entry);
      try {
        const rawTarget = await fs.readlink(entryPath);
        try {
          await fs.stat(entryPath); // resolves fine → link is live, skip
        } catch {
          // Dangling symlink. Check if the raw target was inside our repo.
          if (rawTarget.startsWith(SOURCE_AGENTS_DIR + path.sep) || rawTarget === SOURCE_AGENTS_DIR) {
            if (!dryRun) await fs.unlink(entryPath);
            console.log(`removed stale agent link: ${entryPath} -> ${rawTarget}`);
          }
        }
      } catch { /* not a symlink, skip */ }
    }
  }

  // Per-file agent links.
  const agents = await listSourceAgents();
  if (agents.length === 0) {
    console.log(`no agents to link (source dir empty or missing): ${SOURCE_AGENTS_DIR}`);
  } else {
    if (!dryRun) {
      await fs.mkdir(agentsTargetDir, { recursive: true });
    }
    for (const name of agents) {
      const sourcePath = path.join(SOURCE_AGENTS_DIR, name);
      const linkPath = path.join(agentsTargetDir, name);
      await createSymlink(linkPath, sourcePath, false, { dryRun, force });
    }
  }

  // Single directory link for scripts/.
  await createSymlink(scaffoldLinkPath, SOURCE_SCRIPTS_DIR, true, { dryRun, force });

  // Skills namespace directory link.
  const skillsParentDir = path.join(agentsTargetDir, 'skills');
  const skillsLinkPath = path.join(skillsParentDir, SKILLS_NAMESPACE);
  if (await exists(SOURCE_SKILLS_DIR)) {
    if (!dryRun) {
      await fs.mkdir(skillsParentDir, { recursive: true });
    }
    await createSymlink(skillsLinkPath, SOURCE_SKILLS_DIR, true, { dryRun, force });
  } else {
    console.log(`no skills to link (source dir missing): ${SOURCE_SKILLS_DIR}`);
  }

  // Per-file slash command links.
  const commands = await listSourceCommands();
  if (commands.length === 0) {
    console.log(`no commands to link (source dir empty or missing): ${SOURCE_COMMANDS_DIR}`);
  } else {
    if (!dryRun) {
      await fs.mkdir(commandsTargetDir, { recursive: true });
    }
    for (const name of commands) {
      const sourcePath = path.join(SOURCE_COMMANDS_DIR, name);
      const linkPath = path.join(commandsTargetDir, name);
      await createSymlink(linkPath, sourcePath, false, { dryRun, force });
    }
  }

  // Default agent setting in settings.json.
  const settingsPath = path.join(target, 'settings.json');
  await ensureDefaultAgent(settingsPath, dryRun);
}

async function cmdUninstall(target, dryRun) {
  const agentsTargetDir = path.join(target, 'agents');
  const commandsTargetDir = path.join(target, 'commands');
  const scaffoldLinkPath = path.join(target, SCAFFOLD_LINK_NAME);

  // Per-file agent links: walk the target dir and remove any symlink pointing into the repo.
  await removeRepoSymlinksFromDir(agentsTargetDir, 'agents', dryRun);

  await removeOurSymlink(scaffoldLinkPath, dryRun);

  // Skills namespace link.
  const skillsLinkPath = path.join(agentsTargetDir, 'skills', SKILLS_NAMESPACE);
  await removeOurSymlink(skillsLinkPath, dryRun);

  // Per-file command links: same shape as agents.
  await removeRepoSymlinksFromDir(commandsTargetDir, 'commands', dryRun);

  // Default agent setting.
  const settingsPath = path.join(target, 'settings.json');
  await removeDefaultAgent(settingsPath, dryRun);
}

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

async function cmdStatus(target) {
  const agentsTargetDir = path.join(target, 'agents');
  const commandsTargetDir = path.join(target, 'commands');
  const scaffoldLinkPath = path.join(target, SCAFFOLD_LINK_NAME);

  console.log(`repo root:        ${REPO_ROOT}`);
  console.log(`target:           ${target}`);
  console.log('');

  // Agents.
  const agents = await listSourceAgents();
  if (agents.length === 0) {
    console.log(`agents source:    ${SOURCE_AGENTS_DIR} (no *${AGENT_FILE_SUFFIX} files)`);
  } else {
    console.log(`agents source:    ${SOURCE_AGENTS_DIR}`);
    for (const name of agents) {
      const sourcePath = path.join(SOURCE_AGENTS_DIR, name);
      const linkPath = path.join(agentsTargetDir, name);
      const state = await classify(linkPath, sourcePath);
      switch (state.kind) {
        case 'correct':
          console.log(`  linked:         ${linkPath}`);
          break;
        case 'missing':
          console.log(`  not linked:     ${linkPath}`);
          break;
        case 'wrong-symlink':
          console.log(`  wrong target:   ${linkPath} -> ${state.resolved ?? '<unreadable>'}`);
          break;
        case 'real':
          console.log(`  real file:      ${linkPath}`);
          break;
      }
    }
  }
  console.log('');

  // Scaffold link.
  const scaffoldState = await classify(scaffoldLinkPath, SOURCE_SCRIPTS_DIR);
  switch (scaffoldState.kind) {
    case 'correct':
      console.log(`scaffold linked:  ${scaffoldLinkPath} -> ${SOURCE_SCRIPTS_DIR}`);
      break;
    case 'missing':
      console.log(`scaffold link:    not present at ${scaffoldLinkPath}`);
      break;
    case 'wrong-symlink':
      console.log(`scaffold link:    wrong target at ${scaffoldLinkPath} -> ${scaffoldState.resolved ?? '<unreadable>'}`);
      break;
    case 'real':
      console.log(`scaffold link:    real file/dir at ${scaffoldLinkPath} (not a symlink)`);
      break;
  }
  console.log('');

  // Skills namespace link.
  const skillsLinkPath = path.join(agentsTargetDir, 'skills', SKILLS_NAMESPACE);
  if (await exists(SOURCE_SKILLS_DIR)) {
    const skillsState = await classify(skillsLinkPath, SOURCE_SKILLS_DIR);
    switch (skillsState.kind) {
      case 'correct':
        console.log(`skills linked:    ${skillsLinkPath} -> ${SOURCE_SKILLS_DIR}`);
        break;
      case 'missing':
        console.log(`skills link:      not present at ${skillsLinkPath}`);
        break;
      case 'wrong-symlink':
        console.log(`skills link:      wrong target at ${skillsLinkPath} -> ${skillsState.resolved ?? '<unreadable>'}`);
        break;
      case 'real':
        console.log(`skills link:      real file/dir at ${skillsLinkPath} (not a symlink)`);
        break;
    }
  } else {
    console.log(`skills source:    ${SOURCE_SKILLS_DIR} (not found)`);
  }
  console.log('');

  // Commands.
  const commands = await listSourceCommands();
  if (commands.length === 0) {
    console.log(`commands source:  ${SOURCE_COMMANDS_DIR} (no *${COMMAND_FILE_SUFFIX} files)`);
  } else {
    console.log(`commands source:  ${SOURCE_COMMANDS_DIR}`);
    for (const name of commands) {
      const sourcePath = path.join(SOURCE_COMMANDS_DIR, name);
      const linkPath = path.join(commandsTargetDir, name);
      const state = await classify(linkPath, sourcePath);
      switch (state.kind) {
        case 'correct':
          console.log(`  linked:         ${linkPath}`);
          break;
        case 'missing':
          console.log(`  not linked:     ${linkPath}`);
          break;
        case 'wrong-symlink':
          console.log(`  wrong target:   ${linkPath} -> ${state.resolved ?? '<unreadable>'}`);
          break;
        case 'real':
          console.log(`  real file:      ${linkPath}`);
          break;
      }
    }
  }

  console.log('');

  // Default agent setting.
  const settingsPath = path.join(target, 'settings.json');
  if (await exists(settingsPath)) {
    try {
      const raw = await fs.readFile(settingsPath, 'utf8');
      const settings = JSON.parse(raw);
      if (settings.agent === 'planner') {
        console.log(`default agent:    planner (set in ${settingsPath})`);
      } else if (settings.agent) {
        console.log(`default agent:    ${settings.agent} (not planner; in ${settingsPath})`);
      } else {
        console.log(`default agent:    not set in ${settingsPath}`);
      }
    } catch {
      console.log(`default agent:    could not parse ${settingsPath}`);
    }
  } else {
    console.log(`default agent:    ${settingsPath} does not exist`);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  try {
    switch (args.command) {
      case 'install':
        await cmdInstall(args.target, args.dryRun, args.force);
        break;
      case 'uninstall':
        await cmdUninstall(args.target, args.dryRun);
        break;
      case 'status':
        await cmdStatus(args.target);
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
