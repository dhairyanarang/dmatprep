#!/usr/bin/env node
/**
 * Refuse to run auth QA against anything that might be production.
 *
 *   node scripts/qa/assert-isolated.mjs
 *
 * The end-to-end auth and sync tests sign users in, write rows and delete them
 * again. Run against the live project that is one mistake away from a real
 * candidate's progress. This gate stands in front of them.
 *
 * It hardcodes nothing. Production is whatever `.env.local` points at — the
 * file the app actually uses — and the QA target is whatever `.env.qa.local`
 * points at. If those are the same project, or if the QA file is missing, or
 * if it carries a service-role key, this exits non-zero and the tests do not
 * run. No project ref or key is printed; only the first four characters of a
 * ref, which is what a human needs to tell two projects apart.
 */
import { existsSync, readFileSync } from 'node:fs'

const read = (file) => {
  if (!existsSync(file)) return null
  const out = {}
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return out
}

/** The subdomain of a Supabase URL is the project ref, and it identifies it. */
const refOf = (url) => (String(url ?? '').match(/https:\/\/([a-z0-9]+)\.supabase\./) ?? [])[1] ?? null
const short = (ref) => (ref ? `${ref.slice(0, 4)}…` : '(none)')

const fail = (...lines) => {
  console.error('\n\x1b[31m✗ refusing to run auth QA.\x1b[0m')
  for (const l of lines) console.error(`  ${l}`)
  console.error('')
  process.exit(1)
}

const prod = read('.env.local')
const qa = read('.env.qa.local')

if (!qa) {
  fail(
    'No .env.qa.local found.',
    'Create a SEPARATE, DISPOSABLE Supabase project and put its URL and publishable',
    'key there. See docs/AUTH_QA_PROCEDURE.md. Never point this at the project in',
    '.env.local — that is the one the app runs against.',
  )
}

const qaRef = refOf(qa.NEXT_PUBLIC_SUPABASE_URL)
const prodRef = prod ? refOf(prod.NEXT_PUBLIC_SUPABASE_URL) : null

if (!qaRef) fail('.env.qa.local has no usable NEXT_PUBLIC_SUPABASE_URL.')

if (prodRef && qaRef === prodRef) {
  fail(
    `The QA project (${short(qaRef)}) is the SAME project as the one in .env.local.`,
    'That is the live project. Point .env.qa.local at a separate, disposable one.',
  )
}

if (!qa.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  fail('.env.qa.local has no NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.')
}

for (const [k, v] of Object.entries(qa)) {
  // A service-role key bypasses row level security entirely. The app never uses
  // one and the QA run must not either, or the tests prove nothing about RLS.
  if (/SERVICE_ROLE|SECRET/i.test(k) || String(v).includes('service_role')) {
    fail(
      `.env.qa.local carries ${k}, which looks like a service-role credential.`,
      'The whole point of the RLS tests is that they run as an ordinary user.',
    )
  }
}

if (qa.NEXT_PUBLIC_SUPABASE_URL === prod?.NEXT_PUBLIC_SUPABASE_URL) {
  fail('The QA URL is byte-identical to the production URL.')
}

console.log('\n\x1b[32m✓ isolation confirmed.\x1b[0m')
console.log(`  production (.env.local)  project ${short(prodRef)}`)
console.log(`  QA target (.env.qa.local) project ${short(qaRef)}`)
console.log('  They are different projects, and the QA target carries no service-role key.\n')
