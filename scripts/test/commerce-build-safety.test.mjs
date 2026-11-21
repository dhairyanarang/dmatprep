/**
 * A commerce build cannot ship a paywall with the answers behind it public.
 *
 * `scripts/build-solutions.mjs` decides what lands in `public/solutions/` from
 * `COMMERCE_ENABLED`; the app decides whether to charge from
 * `NEXT_PUBLIC_COMMERCE_ENABLED`. Nothing used to force those to agree, and
 * the dangerous half-configuration is silent: the interface locks questions,
 * shows a price and takes money, while every answer it is charging for sits at
 * a public URL with no authentication in front of it.
 *
 * These tests run the real script, because the guard is only worth anything if
 * it actually stops a build.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
const script = join(root, 'scripts', 'build-solutions.mjs')

/** Runs the builder with a given environment, returning {code, stderr}. */
function run(env) {
  try {
    execFileSync(process.execPath, [script], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
      // A clean slate, so the developer's own shell cannot make this pass.
      env: { ...process.env, COMMERCE_ENABLED: '', NEXT_PUBLIC_COMMERCE_ENABLED: '', ...env },
    })
    return { code: 0, stderr: '' }
  } catch (error) {
    return { code: error.status ?? 1, stderr: String(error.stderr ?? '') }
  }
}

test('the build refuses when the app would charge but the answers stay public', () => {
  const { code, stderr } = run({ NEXT_PUBLIC_COMMERCE_ENABLED: '1' })
  assert.equal(code, 1, 'the build should have failed')
  assert.match(stderr, /COMMERCE CONFIGURATION MISMATCH/)
  assert.match(stderr, /public URL/)
})

test('the build refuses when the answers are withheld but the app is free', () => {
  // The mirror image, and a real failure too: free practice could not be
  // marked, because the solutions it needs would not be served.
  const { code, stderr } = run({ COMMERCE_ENABLED: '1' })
  assert.equal(code, 1, 'the build should have failed')
  assert.match(stderr, /COMMERCE CONFIGURATION MISMATCH/)
})

test('the build runs when both agree', () => {
  // Off is the committed state, so this both passes and restores the files the
  // two tests above never got far enough to touch.
  assert.equal(run({}).code, 0)
})

test('the premium half and the free half never overlap', () => {
  // A question in both would be withheld and served at once, which in practice
  // means served — the public asset wins because nothing authenticates it.
  const freeSet = JSON.parse(readFileSync(join(root, 'content/access/free-set.json'), 'utf8'))
  const premiumDir = join(root, 'content/access/premium-solutions')

  for (const file of readdirSync(premiumDir).filter((f) => f.endsWith('.json'))) {
    const section = file.replace(/\.json$/, '')
    const premium = Object.keys(JSON.parse(readFileSync(join(premiumDir, file), 'utf8')))
    const free = new Set(freeSet.sections[section] ?? [])
    const both = premium.filter((id) => free.has(id))
    assert.deepEqual(both, [], `${section}: ids in both the free set and the premium half`)
  }
})

test('every premium solution carries an answer, so the gate is worth having', () => {
  // A "premium" file of empty objects would pass every structural check and
  // protect nothing.
  const premiumDir = join(root, 'content/access/premium-solutions')
  for (const file of readdirSync(premiumDir).filter((f) => f.endsWith('.json'))) {
    const entries = Object.entries(JSON.parse(readFileSync(join(premiumDir, file), 'utf8')))
    assert.ok(entries.length > 0, `${file} is empty`)
    for (const [id, entry] of entries) {
      const hasKey =
        typeof entry.correctOptionId === 'string' ||
        (entry.imageAnswers && Object.keys(entry.imageAnswers).length > 0)
      assert.ok(hasKey, `${file}: ${id} carries no answer key`)
    }
  }
})
