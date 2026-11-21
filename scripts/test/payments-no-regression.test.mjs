/**
 * Introducing payments must not take anything away from anyone.
 *
 * Every Core question is free today, with its explanation in a public asset.
 * The access policy forbids a silent change, so the free/premium split is
 * behind a flag: with `COMMERCE_ENABLED` unset, `public/solutions/` carries
 * EVERY active solution exactly as it did before, and the purchase surface is
 * not rendered at all.
 *
 * These tests are what stop that regressing on a deploy. They check the
 * committed artefacts, not the intent.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))

const SECTIONS = ['figure-sequences', 'mathematical-equations', 'latin-squares']
const freeSet = read('content/access/free-set.json')

test('the free set is still 150 questions, 50 per section', () => {
  let total = 0
  for (const section of SECTIONS) {
    const ids = freeSet.sections[section] ?? []
    assert.equal(ids.length, 50, `${section} should have 50 free questions`)
    assert.equal(new Set(ids).size, 50, `${section} free list has a duplicate`)
    total += ids.length
  }
  assert.equal(total, 150)
  assert.equal(freeSet.perSection, 50)
})

test('with the split off, every active solution is still publicly served', () => {
  // The regression that would matter: 234 explanations disappearing from the
  // free product on the next deploy, with no announcement.
  for (const section of SECTIONS) {
    const bank = read(`content/sections/${section}/questions.json`)
    const active = bank.filter((q) => !q.meta?.quarantined)
    const served = read(`public/solutions/${section}.json`)
    assert.equal(
      Object.keys(served).length,
      active.length,
      `public/solutions/${section}.json should carry all ${active.length} active solutions while the split is off`,
    )
    for (const q of active) {
      assert.ok(served[q.id], `${q.id} lost its public solution`)
    }
  }
})

test('every free question has a publicly served solution', () => {
  // True under both settings of the flag, and the thing a free user needs.
  for (const section of SECTIONS) {
    const served = read(`public/solutions/${section}.json`)
    for (const id of freeSet.sections[section] ?? []) {
      assert.ok(served[id], `free question ${id} has no public solution`)
    }
  }
})

test('the premium half exists, outside public/, and is the complement', () => {
  for (const section of SECTIONS) {
    const bank = read(`content/sections/${section}/questions.json`)
    const active = bank.filter((q) => !q.meta?.quarantined).map((q) => q.id)
    const free = new Set(freeSet.sections[section] ?? [])
    const premium = read(`content/access/premium-solutions/${section}.json`)
    const expected = active.filter((id) => !free.has(id))

    assert.equal(Object.keys(premium).length, expected.length, `${section} premium count`)
    for (const id of expected) assert.ok(premium[id], `${id} missing from the premium half`)
    for (const id of Object.keys(premium)) {
      assert.ok(!free.has(id), `${id} is free but appears in the premium half`)
    }
  }
})

test('no quarantined question appears in either half', () => {
  for (const section of SECTIONS) {
    const bank = read(`content/sections/${section}/questions.json`)
    const quarantined = bank.filter((q) => q.meta?.quarantined).map((q) => q.id)
    const served = read(`public/solutions/${section}.json`)
    const premium = read(`content/access/premium-solutions/${section}.json`)
    for (const id of quarantined) {
      assert.ok(!served[id], `quarantined ${id} is in public/solutions`)
      assert.ok(!premium[id], `quarantined ${id} is in the premium half`)
    }
  }
})

test('the free selection is still the approved one', () => {
  // The ids themselves are hash-locked by `scripts/test/free-set.test.mjs`,
  // which is the right place for it and is not duplicated here. This only
  // pins the approval date, so a silent re-selection is visible in a diff.
  assert.equal(freeSet.approvedOn, '2026-11-13')
})
