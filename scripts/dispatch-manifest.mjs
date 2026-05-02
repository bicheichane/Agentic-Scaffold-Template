#!/usr/bin/env node
// scripts/dispatch-manifest.mjs
//
// Outputs a reviewer dispatch manifest scoped to the calling agent.
// Called by agents at runtime to discover available reviewers and skills.
//
// Usage: node dispatch-manifest.mjs --scope=<planner|coder|qa|docs|generic>
//
// The script reads skill files from:
//   ~/.claude/agents/skills/agentic-template/reviewer/
//
// Flags:
//   --scope=<value>  Required. One of: planner, coder, qa, docs, generic.
//   --help / -h      Print usage and exit.
//
// Exit codes: 0 success, 1 usage error.
//
// Cross-platform: pure Node 18+, no deps.

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import process from 'node:process';

// Scopes that output all three reviewer sections (plan, code, alignment).
const FULL_SCOPES = new Set(['planner', 'generic']);

// Scopes that output only the reviewer section (self-review only).
const CODE_ONLY_SCOPES = new Set(['coder', 'qa', 'docs']);

const VALID_SCOPES = [...FULL_SCOPES, ...CODE_ONLY_SCOPES];

// Hardcoded mapping: which skill slugs each scope may use.
// null = no filter; include every discovered slug.
// array = include only these slugs (if present on disk).
const SCOPE_SKILLS = {
  planner: null,
  coder:   ['security', 'patterns', 'perf', 'error-handling', 'spec'],
  qa:      ['test-quality', 'test-coverage-map'],
  docs:    ['docs-accuracy', 'docs-completeness'],
  generic: null,
};

const SKILLS_DIR = path.join(
  os.homedir(),
  '.claude',
  'agents',
  'skills',
  'agentic-template',
  'reviewer'
);

function parseArgs(argv) {
  const args = { scope: null };
  for (const a of argv.slice(2)) {
    if (a === '--help' || a === '-h') {
      printUsage();
      process.exit(0);
    } else if (a.startsWith('--scope=')) {
      args.scope = a.slice('--scope='.length);
    } else if (a.startsWith('--')) {
      console.error(`unknown flag: ${a}`);
      printUsage();
      process.exit(1);
    } else {
      console.error(`unexpected argument: ${a}`);
      printUsage();
      process.exit(1);
    }
  }
  if (!args.scope) {
    console.error('error: --scope is required');
    printUsage();
    process.exit(1);
  }
  if (!VALID_SCOPES.includes(args.scope)) {
    console.error(`error: invalid scope "${args.scope}"`);
    printUsage();
    process.exit(1);
  }
  return args;
}

function printUsage() {
  console.error(
    'usage: dispatch-manifest.mjs --scope=<planner|coder|qa|docs|generic>'
  );
}

async function discoverSkills(scope) {
  let allSlugs;
  try {
    const entries = await fs.readdir(SKILLS_DIR);
    allSlugs = entries
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.slice(0, -'.md'.length))
      .sort();
  } catch {
    // Directory doesn't exist or is unreadable — return empty with a warning.
    return { slugs: [], warning: `# Warning: skills directory not found at ${SKILLS_DIR}` };
  }

  const filter = SCOPE_SKILLS[scope];
  if (filter === null) {
    return { slugs: allSlugs, warning: null };
  }

  // Keep only slugs that are both in the allow-list and present on disk.
  const available = new Set(allSlugs);
  const slugs = filter.filter((slug) => available.has(slug));
  return { slugs, warning: null };
}

function renderReviewerSection(slugs) {
  const lines = [];
  lines.push('## reviewer');
  lines.push('Type: parallel-swarm');
  lines.push('Output path pattern: agent-artifacts/reviews/review-{slug}.md');
  if (slugs.length === 0) {
    lines.push('Available skills: none');
  } else {
    lines.push('Available skills:');
    for (const slug of slugs) {
      lines.push(`  - ${slug}`);
    }
  }
  lines.push('');
  lines.push('Spawn template (per skill):');
  lines.push('  Scope slug: {slug}');
  lines.push('  Output path: agent-artifacts/reviews/review-{slug}.md');
  return lines.join('\n');
}

function renderFullManifest(scope, slugs) {
  const lines = [];
  lines.push(`# Reviewer Dispatch Manifest (scope: ${scope})`);
  lines.push('');
  lines.push('## plan-reviewer');
  lines.push('Type: single-invocation');
  lines.push('Output path: agent-artifacts/reviews/review-plan.md');
  lines.push('Skills: none (heuristics inline)');
  lines.push('');
  lines.push(renderReviewerSection(slugs));
  lines.push('');
  lines.push('## alignment-reviewer');
  lines.push('Type: single-invocation');
  lines.push('Output path: agent-artifacts/reviews/review-alignment.md');
  lines.push('Skills: none (heuristics inline)');
  return lines.join('\n');
}

function renderCodeOnlyManifest(scope, slugs) {
  const lines = [];
  lines.push(`# Reviewer Dispatch Manifest (scope: ${scope})`);
  lines.push('');
  lines.push(renderReviewerSection(slugs));
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const { slugs, warning } = await discoverSkills(args.scope);

  if (warning) {
    process.stdout.write(warning + '\n\n');
  }

  let manifest;
  if (FULL_SCOPES.has(args.scope)) {
    manifest = renderFullManifest(args.scope, slugs);
  } else {
    manifest = renderCodeOnlyManifest(args.scope, slugs);
  }

  process.stdout.write(manifest + '\n');
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
