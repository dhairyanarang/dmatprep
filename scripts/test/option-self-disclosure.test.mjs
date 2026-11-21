/**
 * An option set must not hand over a quantity the source is meant to supply.
 *
 * This is not cross-question leakage — the question gives itself away on its
 * own — so no existing gate saw it, and two separate ablation rounds had to
 * find it by hand. It is mechanical, so it is checked.
 *
 * Two shapes:
 *
 *   RATE CLUSTER   two or more options are the same rate under different
 *                  roundings. gam-econ-pt-001-q1 offers 480, 481.60 and 484
 *                  against a stem tonnage of 120.4 — 120 x 4, 120.4 x 4,
 *                  121 x 4 — so the per-tonne rate the item exists to test is
 *                  recoverable from the options alone.
 *
 *   COMPOSITION    one option is the product of two others over a stem number,
 *                  which is how a two-stage rate pair leaks.
 *                  gam-math-tsi-001-q1: 60 = 400 x 750 / 5000, exposing 8%
 *                  and 15%.
 *
 * Both are warnings rather than errors: the known instances are on committed
 * items that are otherwise sound, and the judgement about whether the residual
 * question is still worth asking belongs to a reviewer.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

import { validatePack } from '../gam/lib/validate.mjs'

const packsDir = new URL('../../content/gam/packs/', import.meta.url)
const packs = readdirSync(packsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(new URL(f, packsDir), 'utf8')))

const disclosureWarnings = (file) =>
  (validatePack(file).warnings ?? []).filter((w) => /discloses a quantity|composes a two-stage/.test(w))

test('the check is wired into pack validation', () => {
  assert.ok(packs.length >= 5, 'no packs loaded')
  const all = packs.flatMap(disclosureWarnings)
  assert.ok(all.length > 0, 'the check found nothing at all — it is probably not running')
})

test('the findings on record are exactly the ones known', () => {
  const found = new Set(packs.flatMap(disclosureWarnings).map((w) => w.split(':')[0]))
  // gam-cs-oc-001-q7 sits in a pack retired in September for precisely this —
  // the check rediscovering it independently is the point, not a surprise.
  assert.deepEqual(
    [...found].sort(),
    ['gam-cs-oc-001-q7', 'gam-econ-pt-001-q1', 'gam-math-tsi-001-q1'],
    'the set of self-disclosing option sets changed — say why in the commit',
  )
})

test('NEGATIVE CONTROL: a planted rate cluster is detected', () => {
  const file = structuredClone(packs.find((p) => p.questions.length));
  file.questions[0] = {
    ...file.questions[0],
    stem: 'A consignment of 250 tonnes is landed. What is the fee?',
    options: [
      { id: 'a', text: '1500 euros' },
      { id: 'b', text: '1512 euros' },
      { id: 'c', text: '90 euros' },
      { id: 'd', text: '4000 euros' },
    ],
  }
  const found = disclosureWarnings(file)
  assert.ok(
    found.some((w) => /same rate of 6/.test(w)),
    `a planted cluster at 6 per tonne was not detected: ${JSON.stringify(found)}`,
  )
})

test('NEGATIVE CONTROL: an innocent numeric option set is not flagged', () => {
  // Four values with no shared rate against the stem and no composition.
  const file = structuredClone(packs.find((p) => p.questions.length))
  file.questions = [
    {
      ...file.questions[0],
      id: 'synthetic-clean',
      stem: 'A line runs 317 items in a shift. How many are rejected?',
      options: [
        { id: 'a', text: '7' },
        { id: 'b', text: '23' },
        { id: 'c', text: '41' },
        { id: 'd', text: '58' },
      ],
    },
  ]
  assert.deepEqual(disclosureWarnings(file), [], 'a clean option set was flagged — the check is too eager')
})
