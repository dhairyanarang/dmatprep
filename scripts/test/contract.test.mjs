/**
 * Phase 15: the generator must be structurally incapable of emitting a
 * FORBIDDEN mechanic — not merely discouraged from it by review.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  FS_CONTRACT,
  equationContractErrors,
  figureRuleContractErrors,
  latinContractErrors,
} from '../lib/contract.mjs'
import { verifyQuestion } from '../lib/verify.mjs'
import { readBank } from '../lib/bank.mjs'
import { figureFingerprint, latinFingerprint } from '../lib/fingerprint.mjs'

const base = {
  movement: { type: 'linear', axis: 'vertical', line: 1, direction: 'up', step: 1, boundary: 'bounce' },
  rotation: { type: 'none' },
  colour: { type: 'constant' },
}

describe('figure sequence mechanics contract', () => {
  test('accepts the documented mechanics', () => {
    assert.deepEqual(figureRuleContractErrors(base), [])
    assert.deepEqual(figureRuleContractErrors({ ...base, movement: { type: 'border', direction: 'clockwise', step: 2 } }), [])
    assert.deepEqual(figureRuleContractErrors({ ...base, movement: { ...base.movement, step: 'x+1' } }), [])
    assert.deepEqual(
      figureRuleContractErrors({ ...base, rotation: { type: 'rotate', direction: 'cw', degrees: 90, accelerating: true } }),
      [],
    )
    assert.deepEqual(
      figureRuleContractErrors({ ...base, colour: { type: 'cycle', colours: ['black', 'pink', 'yellow'] } }),
      [],
    )
  })

  test('rejects linear or diagonal movement above one field per step', () => {
    assert.match(
      figureRuleContractErrors({ ...base, movement: { ...base.movement, step: 2 } }).join(' '),
      /only 1 and x\+1 are attested/,
    )
    assert.match(
      figureRuleContractErrors({ ...base, movement: { type: 'diagonal', direction: 'up-left', step: 3 } }).join(' '),
      /only 1 and x\+1 are attested/,
    )
  })

  test('rejects rotation other than 90 degrees', () => {
    assert.match(
      figureRuleContractErrors({ ...base, rotation: { type: 'rotate', direction: 'cw', degrees: 180 } }).join(' '),
      /only 90° is demonstrated/,
    )
  })

  test('rejects an accelerating colour cycle', () => {
    assert.match(
      figureRuleContractErrors({
        ...base,
        colour: { type: 'cycle', colours: ['black', 'green', 'blue'], accelerating: true },
      }).join(' '),
      /never renders its third colour/,
    )
  })

  test('rejects a colour cycle longer than the attested lengths', () => {
    assert.match(
      figureRuleContractErrors({
        ...base,
        colour: { type: 'cycle', colours: ['black', 'green', 'blue', 'pink'] },
      }).join(' '),
      /only 2 and 3 are attested/,
    )
  })

  test('the symbol ceiling is four, matching official Ex 5 and Ex 6', () => {
    assert.equal(FS_CONTRACT.allowed.maxSymbols, 4)
  })

  test('verifyQuestion rejects an over-populated item rather than throwing', () => {
    const q = structuredClone(readBank('figure-sequences')[0])
    const extra = { ...q.given[0].symbols[0], id: 'sX' }
    for (const panel of q.given) panel.symbols.push({ ...extra, cell: { row: 3, col: 3 } })
    const { errors } = verifyQuestion(q)
    assert.ok(errors.length > 0, 'a malformed item must be reported, not thrown on')
    assert.match(errors.join(' '), /no rule for symbol/)
  })

  test('verifyQuestion reports a five-symbol item with well-formed rules', () => {
    const bank = readBank('figure-sequences')
    const q = structuredClone(bank.find((x) => x.given[0].symbols.length === 1))
    // Four extra static symbols, parked on cells the mover never visits so the
    // item fails on symbol count alone rather than on an overlap.
    const used = new Set(q.given.flatMap((p) => p.symbols.map((s) => `${s.cell.row},${s.cell.col}`)))
    const free = []
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) if (!used.has(`${r},${c}`)) free.push({ row: r, col: c })
    }
    const cells = free.slice(0, 4)
    assert.equal(cells.length, 4, 'need four free cells for the fixture')
    cells.forEach((cell, i) => {
      const id = `sX${i}`
      q.rules[id] = { movement: { type: 'static' }, rotation: { type: 'none' }, colour: { type: 'constant' } }
      for (const panel of q.given) {
        panel.symbols.push({ id, shape: 'circle', cell: { ...cell }, rotation: 0, colour: 'black' })
      }
    })
    const { errors } = verifyQuestion(q)
    assert.ok(
      errors.some((e) => /symbols; the official exercises never exceed 4/.test(e)),
      `expected a symbol-count error, got: ${errors.join(' | ')}`,
    )
  })
})

describe('mathematical equations mechanics contract', () => {
  const ok = { equations: ['3 × A = 12', 'A + 2 = B'], variables: ['A', 'B'], solution: { A: 4, B: 6 } }

  test('accepts a documented system', () => {
    assert.deepEqual(equationContractErrors(ok), [])
  })

  test('rejects a quadratic term', () => {
    assert.match(
      equationContractErrors({ ...ok, equations: ['A × B = 12'] }).join(' '),
      /quadratic/,
    )
  })

  test('rejects values outside 1..20', () => {
    assert.match(equationContractErrors({ ...ok, solution: { A: 0, B: 6 } }).join(' '), /outside the documented/)
    assert.match(equationContractErrors({ ...ok, solution: { A: 21, B: 6 } }).join(' '), /outside the documented/)
    assert.match(equationContractErrors({ ...ok, solution: { A: -3, B: 6 } }).join(' '), /outside the documented/)
    assert.match(equationContractErrors({ ...ok, solution: { A: 1.5, B: 6 } }).join(' '), /outside the documented/)
  })

  test('rejects an unsupported operator', () => {
    assert.ok(equationContractErrors({ ...ok, equations: ['A ^ 2 = 16'] }).length > 0)
  })
})

describe('latin square mechanics contract', () => {
  test('accepts the committed bank', () => {
    for (const q of readBank('latin-squares')) assert.deepEqual(latinContractErrors(q), [], q.id)
  })

  test('rejects an undocumented technique', () => {
    const q = structuredClone(readBank('latin-squares')[0])
    q.solutionSteps[0].technique = 'hidden-single'
    assert.match(latinContractErrors(q).join(' '), /not documented/)
  })

  test('rejects a depth beyond the ceiling', () => {
    const q = structuredClone(readBank('latin-squares')[0])
    q.forcedPlacementDepth = 9
    assert.match(latinContractErrors(q).join(' '), /exceeds the 7 ceiling/)
  })
})

describe('structural fingerprints (Phase 18)', () => {
  test('figure items differing only by symmetry share a fingerprint', () => {
    const bank = readBank('figure-sequences')
    const q = bank.find((x) => x.given[0].symbols.length === 1)
    assert.ok(q)

    // Mirror the whole item left-to-right. Same reasoning task, different cells.
    const mirrored = structuredClone(q)
    for (const panel of mirrored.given) {
      for (const s of panel.symbols) s.cell.col = 3 - s.cell.col
    }
    const rule = mirrored.rules[q.given[0].symbols[0].id]
    if (rule.movement.type === 'linear' && rule.movement.axis === 'vertical') {
      rule.movement.line = 3 - rule.movement.line
    }
    assert.equal(
      figureFingerprint(mirrored).key,
      figureFingerprint(q).key,
      'a mirrored item should not count as a new structure',
    )
  })

  test('latin fingerprints include target distance', () => {
    const bank = readBank('latin-squares')
    const withPrereq = bank.find((q) => q.solutionSteps.length > 2)
    assert.ok(withPrereq)
    assert.equal(typeof latinFingerprint(withPrereq).targetDistance, 'number')
  })
})
