#!/usr/bin/env node
/**
 * Append-only batch generation.
 *
 *   node scripts/generate-batch.mjs --batch b2 --section figure-sequences \
 *        --low 5 --medium 5 --high 5 [--plan content/question-authoring/plans/b2.json] [--dry-run]
 *
 * This is the only supported way to add questions. It reads the existing bank,
 * generates the requested slots from independent per-item seeds, runs the same
 * verifier `verify-bank` runs, and appends. It refuses — loudly, without writing
 * — if any existing item would change or any id would be reused.
 *
 * The runner it replaced regenerated whole sections from one shared RNG stream,
 * so a quota change silently rewrote most of the bank under unchanged ids.
 */
import { readFileSync, existsSync } from 'node:fs'

import { generateFigureSequences } from './generate/figure-sequences.mjs'
import { generateLatinSquares } from './generate/latin-squares.mjs'
import { generateMathEquations } from './generate/math-equations.mjs'
import { appendToBank, readBank, snapshot, diffSnapshots, SECTIONS } from './lib/bank.mjs'
import { validatePlan } from './lib/plan.mjs'
import { assertBatchId } from './lib/seed.mjs'

const GENERATORS = {
  'figure-sequences': generateFigureSequences,
  'mathematical-equations': generateMathEquations,
  'latin-squares': generateLatinSquares,
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) args[key] = true
    else {
      args[key] = next
      i++
    }
  }
  return args
}

const args = parseArgs(process.argv.slice(2))
const usage = `
Usage:
  node scripts/generate-batch.mjs --batch <id> --section <section> [--low N] [--medium N] [--high N]

Options:
  --batch <id>     batch identifier, e.g. b2 (required; b1 is the original bank)
  --section <id>   ${SECTIONS.join(' | ')} (required)
  --low/--medium/--high N   how many to add to each tier (default 0)
  --plan <path>    generation plan JSON; recorded and required for batches over 20 items
  --dry-run        generate and validate, but write nothing
`

if (args.help || !args.batch || !args.section) {
  console.log(usage)
  process.exit(args.help ? 0 : 1)
}

const batchId = assertBatchId(String(args.batch))
if (batchId === 'b1') {
  console.error('b1 is the original bank and cannot be regenerated. Use b2 or later.')
  process.exit(1)
}

const section = String(args.section)
if (!GENERATORS[section]) {
  console.error(`unknown section "${section}". Expected one of: ${SECTIONS.join(', ')}`)
  process.exit(1)
}

const quotas = {
  low: Number(args.low ?? 0),
  medium: Number(args.medium ?? 0),
  high: Number(args.high ?? 0),
}
const total = quotas.low + quotas.medium + quotas.high
if (total === 0) {
  console.error('nothing to generate — pass at least one of --low, --medium, --high')
  process.exit(1)
}

// Spec §6: a batch of any size needs a written plan. Enforced above 20 items,
// where "we'll remember what we intended" stops being true.
let plan = null
if (args.plan) {
  const path = String(args.plan)
  if (!existsSync(path)) {
    console.error(`generation plan not found: ${path}`)
    process.exit(1)
  }
  plan = JSON.parse(readFileSync(path, 'utf8'))
  const planErrors = validatePlan(plan)
  if (planErrors.length) {
    console.error(`generation plan ${path} is invalid:`)
    for (const e of planErrors) console.error(`    ${e}`)
    process.exit(1)
  }
  if (plan.batchId !== batchId) {
    console.error(`plan is for batch ${plan.batchId}, but --batch is ${batchId}`)
    process.exit(1)
  }
  if (plan.section !== section) {
    console.error(`plan is for section ${plan.section}, but --section is ${section}`)
    process.exit(1)
  }
} else if (total > 20) {
  console.error(
    `a batch of ${total} items requires --plan (spec §6).\n` +
      'See content/question-authoring/GENERATION_PLAN.md for the template.',
  )
  process.exit(1)
}

const dryRun = Boolean(args['dry-run'])
const before = snapshot()

console.log(`Generating batch ${batchId} for ${section}: low ${quotas.low}, medium ${quotas.medium}, high ${quotas.high}`)
if (plan) console.log(`Plan: ${plan.name ?? args.plan}`)
if (plan?.slotTargets) {
  const described = Object.entries(plan.slotTargets)
    .flatMap(([tier, list]) =>
      list.map((t, i) => (t ? `${tier}[${i}]=${t.shape ?? `${t.symbols} symbols`}` : null)).filter(Boolean),
    )
    .join(', ')
  if (described) console.log(`Coverage targets: ${described}`)
}

const existing = readBank(section)
let result
try {
  result = GENERATORS[section]({ batchId, quotas, existing, slotTargets: plan?.slotTargets ?? {} })
} catch (e) {
  console.error(`\n✗ generation failed: ${e.message}`)
  console.error('\nNothing was written. Do not relax the gates to make this pass —')
  console.error('a refusal here is the pipeline reporting a real capacity or fidelity limit.')
  process.exit(1)
}

console.log(
  `\nBuilt ${result.questions.length} items ` +
    `(${result.stats.attempted} attempts, ${result.stats.verifyRejected} rejected by the verifier, ` +
    `${result.stats.duplicateRejected} as structural duplicates)`,
)
for (const q of result.questions) {
  console.log(`  ${q.id}  seed ${q.generator.seed}  attempt ${q.generator.seedCoordinates.attempt}`)
}

const summary = appendToBank(section, result.questions, { dryRun })

// Prove the existing bank is untouched, on disk, after the write.
const after = snapshot()
const diff = diffSnapshots(before, after)
if (!diff.clean) {
  console.error('\n✗ EXISTING ITEMS CHANGED — this must never happen')
  for (const id of diff.changed) console.error(`    mutated: ${id}`)
  for (const id of diff.removed) console.error(`    removed: ${id}`)
  process.exit(1)
}

console.log(
  `\n✓ ${dryRun ? '[dry run] would append' : 'appended'} ${summary.appended} items to ${section} ` +
    `(${summary.existingCount} → ${summary.total})`,
)
console.log(`✓ all ${before[section].length} pre-existing items byte-identical`)
console.log('\nNow run: npm run verify:bank')
