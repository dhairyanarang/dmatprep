/**
 * The four fixed Core mocks are a committed artefact, and nothing may quietly
 * change them.
 *
 * A mock is only worth sitting twice if it is the same test twice. The practice
 * runner plans from a pool at run time, ranking by what the candidate has
 * already seen, so it produces a different test on every visit — right for
 * practice, and fatal for a mock: two scores from two different tests cannot be
 * compared, which is the only thing a mock score is for.
 *
 * So the lists live in `content/access/core-mocks.json`, generated once by
 * `scripts/build-core-mocks.mjs` and then frozen. The last test locks them to a
 * recorded hash, so regenerating them is a deliberate act that updates the lock
 * in the same commit, and an accidental one fails loudly.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

import { readBank, SECTIONS } from '../lib/bank.mjs'

const mocks = JSON.parse(
  readFileSync(new URL('../../content/access/core-mocks.json', import.meta.url), 'utf8'),
)

const PER_SECTION = 20
const MOCKS = 4

/** Every id across every mock, in the canonical order the lock is taken over. */
const allIds = mocks.sets.flatMap((set) => SECTIONS.flatMap((s) => set.sections[s] ?? []))

test('there are four mocks, each a full Core sitting', () => {
  assert.equal(mocks.sets.length, MOCKS)
  assert.equal(mocks.questionsPerSection, PER_SECTION)

  for (const set of mocks.sets) {
    for (const section of SECTIONS) {
      assert.equal(
        set.sections[section]?.length,
        PER_SECTION,
        `${set.id}: ${section} does not hold ${PER_SECTION} questions`,
      )
    }
  }
})

test('no question appears in two mocks, or twice in one', () => {
  // The whole point of four mocks rather than one is four independent
  // measurements. A question shared between two of them makes the second
  // sitting partly a memory test, and its score partly a lie.
  assert.equal(new Set(allIds).size, allIds.length, 'a question appears in more than one place')
  assert.equal(allIds.length, MOCKS * SECTIONS.length * PER_SECTION)
})

test('every id resolves to an active, non-quarantined question', () => {
  // Resolvable is not enough: a quarantined question stays in the file so old
  // attempts can still name it, but it tests a mechanic the official material
  // does not document, so it must never be put in front of a candidate.
  for (const section of SECTIONS) {
    const byId = new Map(readBank(section).map((q) => [q.id, q]))
    for (const set of mocks.sets) {
      for (const id of set.sections[section]) {
        const question = byId.get(id)
        assert.ok(question, `${set.id}/${section}: ${id} is not in the active bank`)
        assert.ok(!question.meta?.quarantined, `${set.id}/${section}: ${id} is quarantined`)
      }
    }
  }
})

test('the four mocks have an identical difficulty profile', () => {
  // Four mocks that are not equally hard are not four measurements of the same
  // thing. The profile is capped by supply rather than chosen, so this asserts
  // that they AGREE, not what they agree on — a bank that grows can shift the
  // shared profile, but never only one mock's.
  for (const section of SECTIONS) {
    const byId = new Map(readBank(section).map((q) => [q.id, q]))
    const profiles = mocks.sets.map((set) => {
      const counts = { low: 0, medium: 0, high: 0 }
      for (const id of set.sections[section]) counts[byId.get(id).difficulty]++
      return counts
    })
    for (const profile of profiles.slice(1)) {
      assert.deepEqual(profile, profiles[0], `${section}: the mocks are not equally hard`)
    }
  }
})

test('the file is data, not a computation', () => {
  // A seed or an algorithm name in the file would be an invitation to
  // regenerate it, which is the one thing it must never do: regenerating under
  // unchanged ids would silently change what "Core mock 2" means to anyone who
  // had already sat it.
  for (const key of ['seed', 'algorithm', 'generatedAt', 'rng']) {
    assert.ok(!(key in mocks), `core-mocks.json carries "${key}" — it must stay a literal list`)
  }
  for (const set of mocks.sets) {
    assert.equal(typeof set.id, 'string')
    assert.equal(typeof set.label, 'string')
    for (const section of SECTIONS) {
      assert.ok(Array.isArray(set.sections[section]), `${set.id}/${section} is not a literal array`)
      for (const id of set.sections[section]) assert.equal(typeof id, 'string')
    }
  }
})

test("the breadcrumb's derived label matches the one each mock carries", async () => {
  // The breadcrumb derives "Core mock 3" from the id instead of reading this
  // file, so that the top bar — which is on every page — does not pull all 240
  // question ids into every bundle. That saving is only safe while the two
  // agree, which is what this asserts.
  const { coreMockLabel, CORE_MOCK_IDS, CORE_MOCK_COUNT, CORE_MOCK_SIZE } = await import(
    '../../lib/content/mock-label.ts'
  )
  for (const set of mocks.sets) {
    assert.equal(
      coreMockLabel(set.id),
      set.label,
      `${set.id}: the breadcrumb would title this page "${coreMockLabel(set.id)}"`,
    )
  }

  // Global search names the mocks from these constants rather than reading the
  // file, so that all 240 question ids stay out of every page's bundle. A
  // fifth mock added to the file must fail here rather than be quietly
  // unsearchable.
  assert.equal(CORE_MOCK_COUNT, mocks.sets.length, 'CORE_MOCK_COUNT is out of step')
  assert.deepEqual(
    CORE_MOCK_IDS,
    mocks.sets.map((s) => s.id),
    'CORE_MOCK_IDS is out of step with the committed mocks',
  )
  for (const set of mocks.sets) {
    const size = SECTIONS.reduce((n, s) => n + set.sections[s].length, 0)
    assert.equal(CORE_MOCK_SIZE, size, `${set.id}: CORE_MOCK_SIZE is out of step`)
  }
})

test('the selection is locked, so any change must be deliberate', () => {
  const LOCK = 'a468eb15875dd5404c6328f0be6913efdb93be5607e26c1397be9d9f1b8cb2a9'
  const actual = createHash('sha256').update(allIds.join('\n')).digest('hex')
  assert.equal(
    actual,
    LOCK,
    'A Core mock changed. If that was intended, update this lock in the same commit ' +
      'and say in the message which questions moved and why — anyone who had already ' +
      'sat that mock now has a score for a different test.',
  )
})
