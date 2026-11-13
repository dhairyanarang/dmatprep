/**
 * The public half and the solution half must agree.
 *
 * Pages serve `getPublicQuestions`, which strips everything that answers a
 * question; `scripts/build-solutions.mjs` writes those same fields out as a
 * static asset the browser fetches. Two lists of field names, in two files, that
 * have to stay identical — so a gate rather than a convention. A field stripped
 * but not written is lost to the product; a field written but not stripped still
 * ships with the page, which is the leak this exists to prevent.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { readBank, SECTIONS } from '../lib/bank.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(root + p, 'utf8')

/** Pulls the quoted strings out of a `const NAME = [ ... ]` literal. */
function keyList(source, name) {
  const at = source.indexOf(name)
  assert.ok(at !== -1, `${name} not found — the gate cannot check what it cannot read`)
  const open = source.indexOf('[', at)
  const close = source.indexOf(']', open)
  assert.ok(open !== -1 && close !== -1, `${name} is not an array literal`)
  const body = source.slice(open + 1, close)
  return [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort()
}

test('the two solution-key lists are identical', () => {
  const stripped = keyList(read('lib/content/registry.ts'), 'const SOLUTION_KEYS')
  const written = keyList(read('scripts/build-solutions.mjs'), 'const SOLUTION_KEYS')
  assert.ok(stripped.length > 4, 'suspiciously few keys stripped')
  assert.deepEqual(
    stripped,
    written,
    'registry.ts strips a different set of fields than build-solutions.mjs writes',
  )
})

test('the solution assets exist and fail closed if they do not', () => {
  for (const section of SECTIONS) {
    const path = `public/solutions/${section}.json`
    assert.ok(existsSync(root + path), `${path} is missing — run npm run build:solutions`)
    const parsed = JSON.parse(read(path))
    assert.ok(Object.keys(parsed).length > 0, `${path} is empty`)
  }
})

test('every served question has a solution, and no quarantined one does', () => {
  for (const section of SECTIONS) {
    const solutions = JSON.parse(read(`public/solutions/${section}.json`))
    const bank = readBank(section)
    const live = bank.filter((q) => !q.meta?.quarantined)
    const quarantined = bank.filter((q) => q.meta?.quarantined)

    const missing = live.filter((q) => !solutions[q.id]).map((q) => q.id)
    assert.deepEqual(missing, [], `${section}: served questions with no solution — practice could not mark them`)

    const leaked = quarantined.filter((q) => solutions[q.id]).map((q) => q.id)
    assert.deepEqual(leaked, [], `${section}: quarantined questions whose solutions are published`)
  }
})

test('a solution entry actually carries the answer', () => {
  // Guards against a strip that silently produces empty objects, which would
  // pass every other check here while breaking marking at runtime.
  for (const section of SECTIONS) {
    const solutions = JSON.parse(read(`public/solutions/${section}.json`))
    for (const [id, entry] of Object.entries(solutions).slice(0, 20)) {
      const hasAnswer = 'correctOptionId' in entry || 'imageAnswers' in entry
      assert.ok(hasAnswer, `${section}/${id}: solution entry names no answer`)
      assert.ok(entry.explanation, `${section}/${id}: solution entry carries no explanation`)
    }
  }
})

test('NEGATIVE CONTROL: a public record carrying an answer is detectable', () => {
  const stripped = keyList(read('lib/content/registry.ts'), 'const SOLUTION_KEYS')
  // A record that still carries its key and explanation must be caught by the
  // same list the stripper uses. If this passes while the list is empty or
  // mis-parsed, every other gate here is vacuous.
  const planted = { id: 'x', stem: 'y', correctOptionId: 'b', explanation: 'because' }
  const found = stripped.filter((k) => k in planted)
  assert.deepEqual(
    found.sort(),
    ['correctOptionId', 'explanation'],
    'the key list would not recognise an answer left on a public record',
  )
})
