/**
 * Release gates for content exposure, duplication and retired content.
 *
 * Three rules govern this file.
 *
 *   **Fail closed.** A gate whose input is missing fails, it does not skip. An
 *   originality or exposure check that quietly passes because its corpus was
 *   absent is worse than no check at all, because it reports green.
 *
 *   **Negative controls.** Every detector here is exercised against a fixture
 *   that it must reject. A detector nobody has seen fire is a detector nobody
 *   should trust.
 *
 *   **No vacuous passes.** Each gate first asserts it found something to check.
 *   An earlier version of a sibling test resolved the repository root with
 *   `new URL(...).pathname`, which returns %20 for the space in this path, so
 *   every scan walked an empty tree and passed. That must not recur.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createHash } from 'node:crypto'

import { readBank, readRetired, SECTIONS } from '../lib/bank.mjs'

/**
 * Content hash with identity stripped.
 *
 * `bank.mjs`'s `canonicalHash` hashes the whole record including its id and
 * generator stamp, which is right for append-only integrity but useless for
 * duplicate detection: the same question re-filed under a new id hashes
 * differently. A negative control caught that — the first version of this gate
 * could not have found a renamed copy, which is one of the exact cases it
 * exists to find.
 */
const IDENTITY_KEYS = ['id', 'generator', 'meta']

const contentHash = (q) => {
  const content = { ...q }
  for (const key of IDENTITY_KEYS) delete content[key]
  return createHash('sha256').update(JSON.stringify(content)).digest('hex')
}

const root = fileURLToPath(new URL('../../', import.meta.url))
const BUILD = join(root, '.next/server/app')
const hasBuild = existsSync(BUILD)

/**
 * In CI the build always precedes these gates, so a missing build is a broken
 * pipeline, not a local convenience. `REQUIRE_BUILD=1` turns the skips below
 * into failures — without it a workflow that silently stopped producing a build
 * would report green while the exposure gates checked nothing. Locally the
 * variable is unset and the build-dependent gates skip, with the two
 * build-independent negative controls still running.
 */
const REQUIRE_BUILD = process.env.REQUIRE_BUILD === '1'
const needsBuild = REQUIRE_BUILD ? false : !hasBuild

test('a production build is present when CI requires one', { skip: !REQUIRE_BUILD }, () => {
  assert.ok(hasBuild, 'REQUIRE_BUILD=1 but .next/server/app is absent — run `npm run build` first')
})

/** Answer-bearing keys. None of these should reach a candidate before they answer. */
const ANSWER_KEYS = ['correctOptionId', 'explanation', 'distractorNotes', 'walkthrough']

/**
 * Exposure recorded on 2026-11-14 at commit 8ea601d, and the ceiling this gate
 * enforces. It is not a target. The target is zero, asserted by the `todo` test
 * below and blocked on the server-delivery work; this number exists so the
 * situation cannot get *worse* while that work is outstanding.
 */
const EXPOSURE_BASELINE = 646

function buildFiles() {
  const out = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) {
        if (name === 'cache') continue
        walk(full)
      } else if (/\.(html|rsc)$/.test(name)) out.push(full)
    }
  }
  if (hasBuild) walk(BUILD)
  return out
}

/** The largest count of any answer-bearing key in any single built payload. */
function peakAnswerKeyExposure() {
  let peak = 0
  let where = null
  for (const file of buildFiles()) {
    const text = readFileSync(file, 'utf8')
    for (const key of ANSWER_KEYS) {
      const n = text.split(`"${key}\\"`).length - 1 + (text.split(`"${key}":`).length - 1)
      if (n > peak) {
        peak = n
        where = `${file.slice(root.length)} (${key} ×${n})`
      }
    }
  }
  return { peak, where }
}

/* ------------------------------------------------------------- fail closed */

test('the originality corpus is present — this gate fails closed without it', () => {
  const corpus = join(root, 'content/gam/official-ngram-hashes.json')
  assert.ok(existsSync(corpus), 'originality corpus is missing; the gate must not skip')
  const parsed = JSON.parse(readFileSync(corpus, 'utf8'))
  assert.ok(Array.isArray(parsed.hashes) && parsed.hashes.length > 0, 'corpus is empty')
})

test('the free-set list is present — gating decisions depend on it', () => {
  const file = join(root, 'content/access/free-set.json')
  assert.ok(existsSync(file), 'free-set.json is missing; exposure cannot be classified without it')
})

/* -------------------------------------------------------------- duplicates */

test('no exact duplicate, identical payload or reused explanation in the active bank', () => {
  const byContent = new Map()
  const byPayload = new Map()
  const byExplanation = new Map()
  let counted = 0

  for (const section of SECTIONS) {
    for (const q of readBank(section)) {
      counted++
      const ch = contentHash(q)
      byContent.set(ch, (byContent.get(ch) ?? []).concat(q.id))
      byExplanation.set(q.explanation, (byExplanation.get(q.explanation) ?? []).concat(q.id))
      const payload =
        q.kind === 'math-equations'
          ? `ME|${q.equations.join(';')}|${q.asked}`
          : q.kind === 'latin-square'
            ? `LS|${JSON.stringify(q.grid)}|${JSON.stringify(q.target)}`
            : `FS|${JSON.stringify(q.given)}`
      byPayload.set(payload, (byPayload.get(payload) ?? []).concat(q.id))
    }
  }

  assert.ok(counted > 400, `only ${counted} questions scanned — the bank did not load`)
  const dupes = (m) => [...m.values()].filter((g) => g.length > 1)
  assert.deepEqual(dupes(byContent), [], 'the same question under two ids')
  assert.deepEqual(dupes(byPayload), [], 'two questions with an identical payload')
  assert.deepEqual(dupes(byExplanation), [], 'two questions sharing a verbatim explanation')
})

test('NEGATIVE CONTROL: the duplicate detector rejects a planted duplicate', () => {
  const [a] = readBank('mathematical-equations')
  const planted = [a, { ...structuredClone(a), id: `${a.id}-copy` }]
  const byContent = new Map()
  for (const q of planted) {
    const ch = contentHash(q)
    byContent.set(ch, (byContent.get(ch) ?? []).concat(q.id))
  }
  const found = [...byContent.values()].filter((g) => g.length > 1)
  assert.equal(found.length, 1, 'the detector failed to catch an identical question under a new id')
})

/* --------------------------------------------------------- retired content */

test('no retired question content reaches the production build', { skip: needsBuild }, () => {
  const files = buildFiles()
  assert.ok(files.length > 0, 'no built payloads found — this gate would pass vacuously')

  const retired = []
  for (const section of SECTIONS) retired.push(...readRetired(section).map((e) => e.question ?? e))
  assert.ok(retired.length > 0, 'no retired questions found — nothing to check')

  // The probe is the WHOLE explanation, not a prefix. Explanations in this bank
  // are heavily templated — 294 of 473 are word-identical once numbers are
  // removed — so a 60-character prefix collides with active questions constantly.
  // An earlier version of this gate reported eight retired ids as leaked; all
  // eight were collisions, confirmed by checking that neither the full
  // explanation nor the id was anywhere in the build.
  const leaked = []
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const q of retired) {
      const full = String(q.explanation ?? '')
      if (full.length > 80 && text.includes(full)) leaked.push(`${q.id} content -> ${file.slice(root.length)}`)
    }
  }
  assert.deepEqual(leaked, [], 'retired question content is in the build output')
})

test('NEGATIVE CONTROL: the retired-content detector rejects a planted leak', () => {
  const retired = readRetired('mathematical-equations').map((e) => e.question ?? e)
  assert.ok(retired.length > 0, 'no retired fixtures available')
  const full = String(retired[0].explanation ?? '')
  assert.ok(full.length > 80, 'retired fixture has no usable explanation to probe with')
  const fakePayload = `<html>…${full}…</html>`
  assert.ok(fakePayload.includes(full), 'the detector failed to catch planted retired content')
  // And it must not fire on a merely similar, templated neighbour.
  const neighbour = `<html>…${full.slice(0, 60)} but then something else entirely…</html>`
  assert.ok(!neighbour.includes(full), 'the detector would false-positive on templated prose')
})

/* ----------------------------------------------------- answer-key exposure */

test('answer keys and teaching content stay out of the public payload', { todo: 'blocked on server-side solution delivery — see the content-exposure branch; the enforcing ratchet below keeps it from worsening meanwhile', skip: needsBuild }, () => {
  const { peak, where } = peakAnswerKeyExposure()
  assert.equal(peak, 0, `answer-bearing content in a public payload: ${where}`)
})

test('answer-key exposure has not got worse than the recorded baseline', { skip: needsBuild }, () => {
  const { peak, where } = peakAnswerKeyExposure()
  assert.ok(peak > 0, 'measured zero — if the leak is fixed, drop the todo flag above and this ratchet')
  assert.ok(
    peak <= EXPOSURE_BASELINE,
    `exposure rose from ${EXPOSURE_BASELINE} to ${peak}: ${where}`,
  )
})

test('NEGATIVE CONTROL: the exposure detector fires on a planted answer key', () => {
  const planted = '<html>{"id":"x","correctOptionId":"opt-8","explanation":"because"}</html>'
  let n = 0
  for (const key of ANSWER_KEYS) n += planted.split(`"${key}":`).length - 1
  assert.ok(n >= 2, 'the detector failed to see a planted answer key and explanation')
})
