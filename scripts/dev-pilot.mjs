#!/usr/bin/env node
/**
 * Start the app against the PILOT Supabase project, never production.
 *
 * Why a script rather than a shell one-liner.
 *
 * Next.js resolves environment variables in this order, stopping at the first
 * place it finds one (verified against
 * `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`):
 *
 *   1. process.env
 *   2. .env.$(NODE_ENV).local
 *   3. .env.local
 *
 * So anything this script puts in `process.env` beats `.env.local`. The danger
 * is NOT an override — it is a GAP. A variable missing from `.env.pilot` is not
 * found in `process.env`, so Next falls through and quietly loads the
 * PRODUCTION value from `.env.local`. You would be running a pilot that is
 * half-pointed at production and nothing would say so.
 *
 * That is why every variable below is REQUIRED. A gap is a hard failure, not a
 * fallback.
 *
 * `.env.local` is opened read-only, to compare one project reference. No value
 * from it is printed, stored or forwarded, and the file is never written.
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const PILOT_FILE = '.env.pilot'

/**
 * Variables the pilot OWNS.
 *
 * Every one must be present in `.env.pilot`, because every one of them has a
 * production counterpart in `.env.local` that would otherwise be used instead.
 */
const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_PROJECT_REF_EXPECTED',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'NEXT_PUBLIC_COMMERCE_ENABLED',
  'COMMERCE_ENABLED',
  'RECONCILE_SECRET',
]

/** Variables that may be present and empty. */
const OPTIONAL = ['PAYMENTS_PROVIDER']

function die(...lines) {
  console.error('\n  ✗ pilot refused to start\n')
  for (const line of lines) console.error(`    ${line}`)
  console.error('')
  process.exit(1)
}

/** A minimal KEY=VALUE reader. Values are never logged. */
function parseEnv(text) {
  const out = {}
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

/** The 20-ish character project reference inside a Supabase URL. */
function projectRef(url) {
  const match = /^https:\/\/([a-z0-9-]+)\.supabase\.(co|in|net)/i.exec(url ?? '')
  return match ? match[1] : null
}

/* ------------------------------------------------------------------ load */

const pilotPath = join(root, PILOT_FILE)
if (!existsSync(pilotPath)) {
  die(
    `${PILOT_FILE} does not exist.`,
    '',
    `  cp .env.pilot.example ${PILOT_FILE}`,
    '',
    'Then fill it in from the dmatprep-pilot project. Never from production.',
  )
}

const pilot = parseEnv(readFileSync(pilotPath, 'utf8'))

/* -------------------------------------------------------------- required */

const missing = REQUIRED.filter((key) => !pilot[key])
if (missing.length) {
  die(
    `${missing.length} required variable${missing.length === 1 ? '' : 's'} missing from ${PILOT_FILE}:`,
    '',
    ...missing.map((key) => `  ${key}`),
    '',
    'This is a hard failure on purpose. A missing variable is NOT left unset —',
    'Next.js would fall through and load the PRODUCTION value from .env.local.',
  )
}

/* ------------------------------------------------- the project-ref guard */

const url = pilot.NEXT_PUBLIC_SUPABASE_URL
const expected = pilot.SUPABASE_PROJECT_REF_EXPECTED
const actual = projectRef(url)

if (!actual) {
  die(
    'NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase project URL.',
    'Expected the form https://<ref>.supabase.co',
  )
}

if (actual !== expected) {
  die(
    'The Supabase project reference does not match.',
    '',
    `  SUPABASE_PROJECT_REF_EXPECTED  ${expected}`,
    `  ref inside the URL             ${actual}`,
    '',
    'One of the two is wrong. Nothing will run until they agree — that',
    'disagreement is the whole point of having both.',
  )
}

/* ------------------------------ actively reject the production project */

const localPath = join(root, '.env.local')
if (existsSync(localPath)) {
  // Read-only, for one comparison. Nothing from this file is printed,
  // forwarded to the child process, or written back.
  const productionRef = projectRef(parseEnv(readFileSync(localPath, 'utf8')).NEXT_PUBLIC_SUPABASE_URL)
  if (productionRef && productionRef === actual) {
    die(
      'The pilot is pointed at the PRODUCTION Supabase project.',
      '',
      'The project reference in .env.pilot is the same one .env.local uses.',
      'Running payment tests against it would write to real tables and real',
      'auth users.',
      '',
      'Use the dmatprep-pilot project reference instead.',
    )
  }
}

/* --------------------------------------------------- Razorpay sanity */

if (pilot.RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
  die(
    'RAZORPAY_KEY_ID is a LIVE key (rzp_live_…).',
    'The pilot takes Test Mode keys only. A live key here would take real money.',
  )
}

if (!pilot.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
  die(
    'RAZORPAY_KEY_ID does not look like a Test Mode key.',
    'Test keys start rzp_test_. Generate one in Razorpay → Test Mode → API Keys.',
  )
}

if (pilot.RAZORPAY_WEBHOOK_SECRET === pilot.RAZORPAY_KEY_SECRET) {
  die(
    'RAZORPAY_WEBHOOK_SECRET is the same value as RAZORPAY_KEY_SECRET.',
    '',
    'They sign two different things with two different schemes. Sharing one',
    'value hides exactly the class of mistake the separation exists to catch.',
    'Choose a different string for the webhook secret.',
  )
}

if (pilot.NEXT_PUBLIC_COMMERCE_ENABLED !== '1' || pilot.COMMERCE_ENABLED !== '1') {
  die(
    'Both NEXT_PUBLIC_COMMERCE_ENABLED and COMMERCE_ENABLED must be 1 in the',
    'pilot, or the purchase flow does not render and the premium split does',
    'not happen at build time.',
  )
}

/* ----------------------------------------------------------------- go */

const env = { ...process.env }
for (const key of [...REQUIRED, ...OPTIONAL]) {
  if (pilot[key] !== undefined) env[key] = pilot[key]
}

// The pilot serves its free half from `.pilot/solutions/` through a rewrite in
// next.config.ts. That rewrite is gated on THIS variable rather than on
// COMMERCE_ENABLED, because production sets COMMERCE_ENABLED too — and when it
// did, the rewrite pointed production at a git-ignored directory and took every
// practice screen down. This file is the only thing that sets it.
env.PILOT_SOLUTIONS = '1'

console.log('')
console.log('  pilot environment loaded')
console.log(`    Supabase project   ${actual}`)
console.log(`    Razorpay mode      test (${pilot.RAZORPAY_KEY_ID.slice(0, 8)}…)`)
console.log(`    commerce           enabled (locally only)`)
console.log(`    .env.local         not used`)
console.log('')

const child = spawn('npx', ['next', 'dev', ...process.argv.slice(2)], {
  cwd: root,
  env,
  stdio: 'inherit',
})
child.on('exit', (code) => process.exit(code ?? 0))
