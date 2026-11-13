/**
 * The free Core sample is a committed list, and nothing may quietly change it.
 *
 * `content/access/free-set.json` names the 150 questions that stay free. The
 * whole point of a file is that it is *not* a computation: a sample recomputed
 * at runtime, or regenerated whenever the bank grows, would silently move a
 * question a candidate was working on behind a paywall. So the list is literal,
 * and the last test here locks its contents to a recorded hash — a deliberate
 * edit updates both the file and the lock, and an accidental one fails loudly.
 *
 * The exclusion of `verify-bank`-flagged items is re-derived here exactly as
 * verify-bank derives it, rather than hardcoding the ids it happens to flag
 * today. A future warning on a selected question must fail this suite.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

import { isLegacy, verifyQuestion } from '../lib/verify.mjs'
import { fingerprintFor, MAX_PER_FINGERPRINT } from '../lib/fingerprint.mjs'
import { readBank, readRetired, SECTIONS } from '../lib/bank.mjs'

const freeSet = JSON.parse(
  readFileSync(new URL('../../content/access/free-set.json', import.meta.url), 'utf8'),
)

const PER_SECTION = 50
const EXPECTED_SPREAD = { low: 17, medium: 17, high: 16 }

/** Every id, in the canonical order the lock is taken over. */
const allIds = SECTIONS.flatMap((s) => freeSet.sections[s] ?? []).sort()

/**
 * The warning set, derived the way scripts/verify-bank.mjs derives it: the
 * per-question checks, plus structural over-concentration, which is a warning
 * for the legacy bank and an error for anything the append-only pipeline made.
 */
function warnedIds(section) {
  const bank = readBank(section)
  const fingerprints = new Map()
  const warned = new Set()

  for (const q of bank) {
    const { warnings } = verifyQuestion(q)
    try {
      const fp = fingerprintFor(q)
      const seen = (fingerprints.get(fp.key) ?? []).concat(q.id)
      fingerprints.set(fp.key, seen)
      if (seen.length > MAX_PER_FINGERPRINT && isLegacy(q)) {
        warnings.push(`structural fingerprint shared with ${seen.slice(0, -1).join(', ')}`)
      }
    } catch {
      /* unfingerprintable kinds simply do not constrain */
    }
    if (warnings.length) warned.add(q.id)
  }
  return warned
}

test('the free set holds exactly 150 ids', () => {
  assert.equal(allIds.length, 150)
})

test('each section contributes exactly 50', () => {
  for (const section of SECTIONS) {
    assert.equal(
      freeSet.sections[section]?.length,
      PER_SECTION,
      `${section}: expected ${PER_SECTION}`,
    )
  }
})

test('no id appears twice, within a section or across them', () => {
  assert.equal(new Set(allIds).size, allIds.length, 'duplicate id in the free set')
})

test('every id resolves to a live question in its own section', () => {
  for (const section of SECTIONS) {
    const byId = new Map(readBank(section).map((q) => [q.id, q]))
    for (const id of freeSet.sections[section]) {
      const q = byId.get(id)
      assert.ok(q, `${section}: ${id} is not in the bank`)
      assert.equal(q.section, section, `${id} is filed under ${q.section}, not ${section}`)
    }
  }
})

test('no selected id is a retired id', () => {
  for (const section of SECTIONS) {
    const retired = new Set(readRetired(section).map((e) => e.question?.id ?? e.id))
    for (const id of freeSet.sections[section]) {
      assert.ok(!retired.has(id), `${section}: ${id} is retired and must never be served`)
    }
  }
})

test('no selected question carries a verify-bank warning', () => {
  for (const section of SECTIONS) {
    const warned = warnedIds(section)
    const offenders = freeSet.sections[section].filter((id) => warned.has(id))
    assert.deepEqual(
      offenders,
      [],
      `${section}: the free sample is the shop window and must not contain flagged items`,
    )
  }
})

test('the approved difficulty spread is 17 low, 17 medium, 16 high per section', () => {
  for (const section of SECTIONS) {
    const byId = new Map(readBank(section).map((q) => [q.id, q]))
    const counts = { low: 0, medium: 0, high: 0 }
    for (const id of freeSet.sections[section]) counts[byId.get(id).difficulty]++
    assert.deepEqual(counts, EXPECTED_SPREAD, `${section}: difficulty spread moved`)
  }
})

test('the file is data, not a computation', () => {
  // A seed, an algorithm name or a generated-at stamp would all be an invitation
  // to regenerate the sample, which is the one thing it must never do.
  for (const key of ['seed', 'algorithm', 'generatedAt', 'generator', 'rng']) {
    assert.ok(!(key in freeSet), `free-set.json carries "${key}" — it must stay a literal list`)
  }
  for (const section of SECTIONS) {
    assert.ok(Array.isArray(freeSet.sections[section]), `${section} is not a literal array`)
    for (const id of freeSet.sections[section]) assert.equal(typeof id, 'string')
  }
})

test('the selection is locked, so any change must be deliberate', () => {
  const LOCK = 'be7175da1bcd3838bcf026b696e2ac33089d1a5f669b0d2b479cb446ee3b777d'
  const actual = createHash('sha256').update(allIds.join('\n')).digest('hex')
  assert.equal(
    actual,
    LOCK,
    'The free set changed. If that was intended, update this lock in the same commit ' +
      'and say in the message which questions moved and why.',
  )
})
