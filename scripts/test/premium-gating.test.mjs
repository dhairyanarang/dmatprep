/**
 * Premium content withholding, and what happens when a solution is absent.
 *
 * Two defects are pinned down here.
 *
 * The first was a crash: `result-banner.tsx` called `.replace()` on a Figure
 * Sequences `correctOptionId` that was not there, so a premium question an
 * unentitled user opened took the page down. Maths and Latin Squares were
 * worse in a quieter way — they did not throw, they silently marked every
 * answer incorrect and showed a blank correct answer.
 *
 * The second is the gate itself: the committed `public/solutions/*.json` carry
 * every active solution, so turning commerce on without changing what is
 * served would have protected nothing at all.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { hasSolution, isCorrect } from '../../lib/types/question.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const SECTIONS = ['figure-sequences', 'mathematical-equations', 'latin-squares']
const freeSet = read('content/access/free-set.json')

/* ------------------------------------------- a withheld solution is not wrong */

const entitledFigure = {
  kind: 'figure-sequence',
  id: 'fs-1',
  images: [
    { label: 'image1', correctOptionId: 'matrix1' },
    { label: 'image2', correctOptionId: 'matrix2' },
  ],
}
const withheldFigure = { kind: 'figure-sequence', id: 'fs-1', images: [{ label: 'image1' }, { label: 'image2' }] }
const entitledMaths = { kind: 'math-equations', id: 'me-1', correctOptionId: 'b' }
const withheldMaths = { kind: 'math-equations', id: 'me-1' }
const entitledLatin = { kind: 'latin-square', id: 'ls-1', correctOptionId: 'C' }
const withheldLatin = { kind: 'latin-square', id: 'ls-1' }

test('an ENTITLED user has a solution for every question kind', () => {
  assert.equal(hasSolution(entitledFigure), true)
  assert.equal(hasSolution(entitledMaths), true)
  assert.equal(hasSolution(entitledLatin), true)
})

test('an UNENTITLED user has no solution, and the code can tell', () => {
  assert.equal(hasSolution(withheldFigure), false)
  assert.equal(hasSolution(withheldMaths), false)
  assert.equal(hasSolution(withheldLatin), false)
})

test('a partially withheld figure sequence counts as withheld', () => {
  // One image answered and one not is not "half gradeable" — it is ungradeable.
  const half = {
    kind: 'figure-sequence',
    id: 'fs-1',
    images: [{ label: 'image1', correctOptionId: 'matrix1' }, { label: 'image2' }],
  }
  assert.equal(hasSolution(half), false)
})

test('grading still works normally for an entitled user', () => {
  assert.equal(isCorrect(entitledFigure, { image1: 'matrix1', image2: 'matrix2' }), true)
  assert.equal(isCorrect(entitledFigure, { image1: 'matrix1', image2: 'matrix9' }), false)
  assert.equal(isCorrect(entitledMaths, { answer: 'b' }), true)
  assert.equal(isCorrect(entitledMaths, { answer: 'a' }), false)
  assert.equal(isCorrect(entitledLatin, { answer: 'C' }), true)
})

test('THE QUIET BUG: a withheld solution must not make a right answer look wrong', () => {
  // Before the fix, Figure Sequences threw and the other two returned false —
  // telling a paying-but-unentitled user they were wrong about a question
  // nobody had graded.
  for (const q of [withheldFigure, withheldMaths, withheldLatin]) {
    assert.equal(hasSolution(q), false, 'the caller must be able to detect this BEFORE grading')
  }
  // isCorrect is reachable in principle, so it must not throw either.
  assert.doesNotThrow(() => isCorrect(withheldFigure, { image1: 'matrix1', image2: 'matrix2' }))
  assert.doesNotThrow(() => isCorrect(withheldMaths, { answer: 'b' }))
})

test('an undefined selection never accidentally matches an undefined answer', () => {
  // The subtle one: `selection[label] === img.correctOptionId` is
  // undefined === undefined, which is TRUE. Without the hasSolution guard a
  // question nobody answered would have been marked correct.
  assert.equal(isCorrect(withheldFigure, {}), false)
  assert.equal(isCorrect(withheldMaths, {}), false)
})

/* ------------------------------------------------ the runner locks, not grades */

test('the practice runner locks a question it cannot grade, before the options', () => {
  const runner = readFileSync(join(root, 'components/practice/practice-runner.tsx'), 'utf8')
  assert.match(runner, /const locked = !hasSolution\(question\)/, 'the runner must detect it')
  assert.match(runner, /locked \? \(\s*<PremiumLocked/, 'and render the locked panel in place of the question')
  assert.match(runner, /!locked && submitted \? \(/, 'and never render feedback for it')
  assert.match(runner, /if \(!hasSolution\(question\)\) return/, 'and never record an attempt for it')
})

test('the result banner can no longer throw on a missing answer', () => {
  const banner = readFileSync(join(root, 'components/practice/result-banner.tsx'), 'utf8')
  assert.ok(
    !/image\.correctOptionId\.replace/.test(banner),
    'the unguarded .replace() is what crashed the page',
  )
  assert.match(banner, /image\.correctOptionId\?\.replace/)
})

/* --------------------------------------------------- the gate, at content level */

test('the pilot free set exists and withholds every premium solution', () => {
  if (!existsSync(join(root, '.pilot/solutions'))) {
    assert.fail('run `npm run build:pilot-solutions` first')
  }
  for (const section of SECTIONS) {
    const served = read(`.pilot/solutions/${section}.json`)
    const free = new Set(freeSet.sections[section] ?? [])
    const published = read(`public/solutions/${section}.json`)

    assert.equal(Object.keys(served).length, 50, `${section}: pilot must serve exactly the free 50`)

    for (const id of Object.keys(served)) {
      assert.ok(free.has(id), `${id} is served to everyone but is not on the free list`)
    }
    // The real assertion: every premium id is ABSENT from what a user without
    // an entitlement can fetch.
    const premiumIds = Object.keys(published).filter((id) => !free.has(id))
    assert.ok(premiumIds.length > 0, `${section}: expected some premium ids to withhold`)
    for (const id of premiumIds) {
      assert.equal(served[id], undefined, `premium ${id} is retrievable without entitlement`)
    }
  }
})

test('the premium half is complete, so an entitled user loses nothing', () => {
  for (const section of SECTIONS) {
    const premium = read(`content/access/premium-solutions/${section}.json`)
    const published = read(`public/solutions/${section}.json`)
    const free = new Set(freeSet.sections[section] ?? [])
    for (const id of Object.keys(published)) {
      if (free.has(id)) continue
      assert.ok(premium[id], `${id} is withheld from free but missing from the premium half`)
    }
  }
})

/* ------------------------------------------------ production must not change */

test('the pilot generator never writes to the committed content', () => {
  const script = readFileSync(join(root, 'scripts/build-pilot-solutions.mjs'), 'utf8')
  const writes = [...script.matchAll(/writeFileSync\(new URL\(`?([^`,)]+)/g)].map((m) => m[1])
  for (const target of writes) {
    assert.ok(
      !/public\/solutions|content\/access\/premium-solutions|content\/sections/.test(target),
      `the pilot generator writes to committed content: ${target}`,
    )
  }
  assert.match(script, /outDir = new URL\('\.\.\/\.pilot\//, 'output must go to .pilot/')
})

test('.pilot/ can never be committed', () => {
  const ignore = readFileSync(join(root, '.gitignore'), 'utf8')
  assert.match(ignore, /^\/\.pilot\/$/m, '.pilot/ must be git-ignored')
})

test('the rewrite that hides premium exists ONLY in pilot mode', () => {
  const config = readFileSync(join(root, 'next.config.ts'), 'utf8')
  // The predicate is PILOT_SOLUTIONS, not COMMERCE_ENABLED. This test passed
  // while production was down: it asserted the right intent against a predicate
  // production also satisfies, so "pilot mode" and "commerce is on" were the
  // same condition and the rewrite followed commerce into production.
  assert.match(
    config,
    /if \(process\.env\.PILOT_SOLUTIONS !== '1'\) return \[\]/,
    'production must get no rewrite at all',
  )
  assert.ok(
    !/COMMERCE_ENABLED !== '1'\) return \[\]/.test(config),
    'the rewrite must not be gated on COMMERCE_ENABLED — production sets it too',
  )
  // The other half of the same contract: the only thing that may turn the
  // rewrite on is the pilot launcher.
  const launcher = readFileSync(join(root, 'scripts/dev-pilot.mjs'), 'utf8')
  assert.match(
    launcher,
    /env\.PILOT_SOLUTIONS = '1'/,
    'the pilot must set the flag its own rewrite depends on',
  )
  assert.match(config, /beforeFiles/, 'it must be a beforeFiles rewrite to override public/')
  // A path parameter, not a query one. `?section=:section` did not substitute,
  // and the failure was silent: the handler refused an unknown section while
  // every structural test here still passed. Verified by calling the URL.
  assert.match(config, /destination: '\/api\/content\/free-solutions\/:section'/)
  assert.ok(
    !/free-solutions\?section=/.test(config),
    'the query-parameter form does not substitute reliably',
  )
})

test('the free-solutions route never falls back to the full file', () => {
  const route = readFileSync(join(root, 'app/api/content/free-solutions/[section]/route.ts'), 'utf8')
  assert.match(route, /pilot-solutions-missing/, 'a missing pilot set must fail, not fall back')
  assert.ok(
    !/public\/solutions/.test(route.replace(/\/\*[\s\S]*?\*\//g, '')),
    'the route must never read the committed public set',
  )
})

test('premium solutions are released only after an entitlement check', () => {
  const route = readFileSync(join(root, 'app/api/content/solutions/route.ts'), 'utf8')
  assert.match(route, /hasPremiumAccess/, 'it must check entitlement')
  assert.match(route, /sign-in-required/, 'and require a session first')
  assert.match(route, /not-entitled/)
  // The order matters: the payload must come after both checks.
  const entitlementAt = route.indexOf('hasPremiumAccess')
  const payloadAt = route.lastIndexOf('return Response.json(PREMIUM')
  assert.ok(entitlementAt < payloadAt, 'the check must precede the payload')
})
