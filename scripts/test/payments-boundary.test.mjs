/**
 * The service-role key must never be able to reach a browser.
 *
 * `lib/payments/server.ts` holds every privileged operation and reads the
 * service-role key, which BYPASSES row level security. The `server-only`
 * package would make a client import a build error; it is not installed, and
 * adding a dependency was out of scope. This test is the enforcement in its
 * place, along with the runtime guard in that module.
 *
 * It is a grep, and a grep is a weaker guarantee than a compiler. It is also
 * the one that exists, and it fails loudly on the mistake that matters.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// A filesystem walk rather than `git ls-files`: git is not guaranteed to be on
// PATH where the suite runs, and a scan that cannot run is a scan that silently
// passes. `scripts/test/content-exposure.test.mjs` learned the same lesson.
const root = fileURLToPath(new URL('../../', import.meta.url))
const SKIP = new Set(['node_modules', '.next', '.git', 'out', 'coverage', '.clarity'])

function sourceFiles(dir = root, found = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) sourceFiles(full, found)
    else if (/\.(ts|tsx|mjs)$/.test(name)) found.push(relative(root, full))
  }
  return found
}

const files = sourceFiles().map((path) => ({
  path,
  text: readFileSync(join(root, path), 'utf8'),
}))

// A scan over an empty tree proves nothing. Fail loudly instead.
if (files.length < 50) {
  throw new Error(`the source scan found only ${files.length} files — the walk is broken`)
}

test('no client component imports the privileged payments module', () => {
  const offenders = files
    .filter((f) => /^\s*['"]use client['"]/m.test(f.text))
    .filter((f) => /lib\/payments\/server/.test(f.text))
    .map((f) => f.path)
  assert.deepEqual(offenders, [], `a 'use client' file imports lib/payments/server: ${offenders}`)
})

test('the privileged Supabase key is read in exactly one module', () => {
  // Both names: Supabase is replacing `service_role` with `secret` keys and
  // deprecating the old one, so either could appear.
  const readers = files
    .filter((f) => /SUPABASE_(SERVICE_ROLE|SECRET)_KEY/.test(f.text))
    .map((f) => f.path)
    .filter((p) => !p.startsWith('scripts/test/'))
    // `.env.example` is names only, and the docs name it to explain it.
    .filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'))
  assert.deepEqual(
    readers,
    ['lib/payments/server.ts'],
    `the service-role key should be read in one module only, found: ${readers}`,
  )
})

test('no secret is prefixed NEXT_PUBLIC_', () => {
  const secrets = [
    'SERVICE_ROLE',
    'SECRET_KEY',
    'KEY_SECRET',
    'WEBHOOK_SECRET',
    'RECONCILE_SECRET',
  ]
  const offenders = []
  for (const f of files) {
    for (const secret of secrets) {
      const pattern = new RegExp(`NEXT_PUBLIC_[A-Z_]*${secret}`)
      if (pattern.test(f.text)) offenders.push(`${f.path} (${secret})`)
    }
  }
  assert.deepEqual(offenders, [], `a secret is exposed to the browser: ${offenders}`)
})

test('no credential value is committed anywhere', () => {
  // Razorpay key ids are `rzp_live_…` / `rzp_test_…`. A real one in the tree is
  // the single worst thing that could be committed here.
  const offenders = files
    .filter((f) => /rzp_(live|test)_[A-Za-z0-9]{8,}/.test(f.text))
    .map((f) => f.path)
  assert.deepEqual(offenders, [], `a Razorpay credential appears in: ${offenders}`)
})

test('.env.example carries names and no values', () => {
  const text = readFileSync(join(root, '.env.example'), 'utf8')
  const assignments = text
    .split('\n')
    .filter((line) => /^[A-Z_]+=/.test(line))
    .filter((line) => line.split('=')[1].trim() !== '')
  assert.deepEqual(assignments, [], `.env.example has values, not just names: ${assignments}`)
})

/* ------------------------------------------------------------ the pilot */

test('.env.pilot.example holds no credential values', () => {
  // Only the two commerce flags carry a value, and `1` is not a secret.
  const text = readFileSync(join(root, '.env.pilot.example'), 'utf8')
  const withValues = text
    .split('\n')
    .filter((line) => /^[A-Z_]+=/.test(line))
    .filter((line) => line.split('=')[1].trim() !== '')
  assert.deepEqual(
    withValues.sort(),
    ['COMMERCE_ENABLED=1', 'NEXT_PUBLIC_COMMERCE_ENABLED=1'],
    `.env.pilot.example carries a value it should not: ${withValues}`,
  )
})

test('the pilot template defines every variable the launcher requires', () => {
  // A variable the launcher demands but the template omits would send someone
  // to the dashboard twice; worse, a variable the launcher FORGETS to demand
  // is one Next.js would silently load from .env.local instead.
  const template = readFileSync(join(root, '.env.pilot.example'), 'utf8')
  const launcher = readFileSync(join(root, 'scripts/dev-pilot.mjs'), 'utf8')

  const required = [...launcher.matchAll(/^\s+'([A-Z_]+)',$/gm)].map((m) => m[1])
  assert.ok(required.length >= 10, 'could not read the launcher\u2019s required list')

  for (const key of required) {
    assert.match(template, new RegExp(`^${key}=`, 'm'), `${key} is required but not in the template`)
  }
})

test('the real .env.pilot can never be committed', () => {
  const ignore = readFileSync(join(root, '.gitignore'), 'utf8')
  assert.match(ignore, /^\.env\*$/m, '.env* must be ignored')
  assert.match(ignore, /^!\.env\.pilot\.example$/m, 'the template must be re-included')
  // The negation must name the template exactly. A looser pattern such as
  // `!.env.pilot*` would re-include `.env.pilot` itself — the filled-in file.
  assert.ok(
    !/^!\.env\.pilot\*/m.test(ignore),
    'the negation must not be a wildcard that would un-ignore .env.pilot',
  )
})

test('the launcher never forwards .env.local values to the child process', () => {
  const launcher = readFileSync(join(root, 'scripts/dev-pilot.mjs'), 'utf8')
  // It reads .env.local for exactly one comparison: the project ref.
  const localReads = [...launcher.matchAll(/parseEnv\(readFileSync\(localPath[^)]*\)[^)]*\)/g)]
  assert.equal(localReads.length, 1, 'the launcher should read .env.local once, for the ref check')
  assert.ok(!/env\[.*\] = local/.test(launcher), 'no .env.local value may reach the child env')
  assert.ok(!/writeFileSync\([^)]*env\.local/.test(launcher), '.env.local must never be written')
})

test('the mock provider cannot be selected in a production build', () => {
  const text = readFileSync(join(root, 'lib/payments/server.ts'), 'utf8')
  // A provider that takes no money must never be able to grant an entitlement
  // on a deployed site, and a stray environment variable is how that happens.
  assert.match(
    text,
    /PAYMENTS_PROVIDER === 'mock'[\s\S]{0,200}NODE_ENV === 'production'/,
    'getProvider must refuse the mock when NODE_ENV is production',
  )
})
