#!/usr/bin/env node
/**
 * The content validation workflow, in one command.
 *
 *   npm run verify:content
 *
 * Runs every gate in the order their inputs become available, stops at the
 * first failure, and says what to do about it. The ordering is not cosmetic:
 * the solution assets are built before the tests because the exposure and
 * answer-delivery gates read them, and the production build precedes the tests
 * because the exposure gates read the built payloads and `REQUIRE_BUILD=1`
 * makes a missing build a failure rather than a skip.
 *
 * Each step is also runnable on its own; the name is printed so a failing step
 * can be re-run directly without reading this file.
 */
import { spawnSync } from 'node:child_process'

const STEPS = [
  {
    name: 'build:solutions',
    cmd: ['npm', 'run', 'build:solutions'],
    why: 'Splits each bank into the public half and the fetched solution half. Later gates read the output.',
    onFail: 'A bank is unreadable or a question is missing a field the split expects.',
  },
  {
    name: 'verify:bank',
    cmd: ['npm', 'run', 'verify:bank'],
    why: 'Re-derives every committed Core question independently — unique solution, invariants, distractor coverage, provenance.',
    onFail: 'A question no longer verifies. The report names the id and the failing check. Do not relax a gate to make it pass.',
  },
  {
    name: 'verify:gam',
    cmd: ['npm', 'run', 'verify:gam'],
    why: 'Three gates over the GAM packs: automated validation, independent adjudication coverage, human sign-off.',
    onFail: 'Gate 1 is a content error. Gate 2 means a pack changed since the round that judged it — re-adjudicate. Gate 3 is a person, and nothing here substitutes for it.',
    allowNonZero: true,
    note: 'Gate 3 is expected to be unmet until a person signs off; this step reports rather than blocks.',
  },
  {
    name: 'lint',
    cmd: ['npm', 'run', 'lint'],
    why: 'Type-adjacent correctness in the app and the scripts.',
    onFail: 'Fix the reported rule violations.',
  },
  {
    name: 'build',
    cmd: ['npm', 'run', 'build'],
    why: 'The production build, which is also the type check, and the input to the exposure gates.',
    onFail: 'A type error or a prerender failure. The exposure gates cannot run without this.',
  },
  {
    name: 'release:check',
    cmd: ['npm', 'run', 'release:check'],
    why: 'Containment over the production build: quarantined and retired content, unapproved drafts, answer delivery, the hygiene-not-protection caveat, official sourcing, and the disclaimer.',
    onFail: 'Each check prints what it measured. A failure is a containment breach, not a style issue.',
  },
  {
    name: 'test',
    cmd: ['npm', 'test'],
    env: { REQUIRE_BUILD: '1' },
    why: 'Generator, solver, contract, provenance, exposure, explanation and append-only gates, each with its negative control.',
    onFail: 'The assertion names the gate and the content that broke it.',
  },
]

let failed = null
for (const step of STEPS) {
  process.stdout.write(`\n\x1b[1m▸ ${step.name}\x1b[0m — ${step.why}\n`)
  const r = spawnSync(step.cmd[0], step.cmd.slice(1), {
    stdio: 'inherit',
    env: { ...process.env, ...step.env },
  })
  const ok = r.status === 0 || step.allowNonZero
  if (!ok) {
    failed = step
    break
  }
  if (step.allowNonZero && r.status !== 0) {
    process.stdout.write(`\x1b[33m  reported, not blocking: ${step.note}\x1b[0m\n`)
  }
}

if (failed) {
  process.stderr.write(`\n\x1b[31m✗ ${failed.name} failed.\x1b[0m\n`)
  process.stderr.write(`  ${failed.onFail}\n`)
  process.stderr.write(`  Re-run just this step:  ${failed.cmd.join(' ')}\n\n`)
  process.exit(1)
}

process.stdout.write('\n\x1b[32m✓ every content gate passed.\x1b[0m\n')
process.stdout.write('  Automated validation only. It proves no question is correct and nobody has signed anything off.\n\n')
