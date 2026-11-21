/**
 * Quarantine is only worth anything if it is airtight at the serving edge.
 *
 * These gates check the two things that make it real: a quarantined question
 * never reaches a pool, and nothing in the teaching material names a mechanic
 * the official rules do not. The second is the one that actually mattered — the
 * movement catalogue taught `direction-cycle` under a heading reading "Every
 * movement you can be shown", so a candidate could have prepared for a mechanic
 * that does not exist. See docs/DIRECTION_CYCLE.md.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { readBank, SECTIONS } from '../lib/bank.mjs'
import { FS_CONTRACT } from '../lib/contract.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(root + p, 'utf8')

test('direction-cycle is not an allowed mechanic', () => {
  assert.ok(
    !FS_CONTRACT.allowed.movementTypes.includes('direction-cycle'),
    'direction-cycle is back in allowed — it is not stated or demonstrated anywhere official',
  )
  assert.ok(
    FS_CONTRACT.forbidden.some((f) => f.includes('direction-cycle')),
    'the forbidden list no longer records why',
  )
})

test('every direction-cycle question is quarantined, and only those', () => {
  const bank = readBank('figure-sequences')
  assert.ok(bank.length > 100, 'the bank did not load')

  const usesIt = (q) =>
    Object.values(q.rules ?? {}).some((r) => r.movement?.type === 'direction-cycle')

  const leaked = bank.filter((q) => usesIt(q) && !q.meta?.quarantined).map((q) => q.id)
  assert.deepEqual(leaked, [], 'direction-cycle questions that are still served')

  const quarantined = bank.filter((q) => q.meta?.quarantined)
  assert.equal(quarantined.length, 86, 'the quarantined count moved — say why in the commit')
  for (const q of quarantined) {
    assert.ok(usesIt(q), `${q.id} is quarantined but does not use direction-cycle`)
    assert.equal(q.meta.dmatAlignment, 'uncertain', `${q.id}: quarantined but still claims alignment`)
    assert.ok(q.meta.quarantined.reason.length > 80, `${q.id}: no substantive quarantine reason`)
    assert.ok(q.meta.quarantined.since, `${q.id}: no quarantine date`)
  }
})

test('a quarantined question stays resolvable by id', () => {
  // Attempts are immutable. One that can no longer name its question is a
  // broken record, so the registry must keep resolving these — it just must
  // never serve them.
  const registry = read('lib/content/registry.ts')
  assert.match(registry, /getQuestion\b[\s\S]*?ALL\[sectionId\]/, 'getQuestion no longer reads the unfiltered bank')
  assert.match(registry, /getQuestions\b[\s\S]*?BANKS\[sectionId\]/, 'getQuestions no longer reads the filtered bank')
  assert.match(registry, /isQuarantined/, 'the registry no longer filters quarantined questions')
})

test('the teaching catalogue names no undocumented mechanic', () => {
  const diagrams = read('components/exam/diagrams.tsx')
  assert.ok(
    !/direction cycle/i.test(diagrams),
    'the movement catalogue teaches direction cycling again — it is not in the official rule list',
  )
})

test('no guide worked example points at a question that does not exist', () => {
  // Both Figure Sequences examples pointed at retired ids and rendered nothing
  // at all, silently, for as long as anyone had looked.
  for (const section of SECTIONS) {
    const guide = read(`content/sections/${section}/guide.ts`)
    const ids = [...guide.matchAll(/questionId:\s*'([^']+)'/g)].map((m) => m[1])
    if (ids.length === 0) continue
    const byId = new Map(readBank(section).map((q) => [q.id, q]))
    for (const id of ids) {
      const q = byId.get(id)
      assert.ok(q, `${section}: worked example points at ${id}, which is not in the bank`)
      assert.ok(!q.meta?.quarantined, `${section}: worked example ${id} is quarantined`)
    }
  }
})
