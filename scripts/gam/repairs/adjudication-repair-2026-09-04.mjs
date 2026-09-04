/**
 * Second repair pass, 4 September 2026 — the two defects the independent round
 * raised against the *repaired* pilot.
 *
 * Both are faults I introduced while closing the leakage, which is the argument
 * for re-adjudicating after a repair rather than assuming the repair is safe.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const dir = new URL('../../../content/gam/packs/', import.meta.url)

function patch(fileName, replacements, mutate) {
  const url = new URL(fileName, dir)
  const file = JSON.parse(readFileSync(url, 'utf8'))
  for (const [id, question] of Object.entries(replacements ?? {})) {
    const i = file.questions.findIndex((q) => q.id === id)
    if (i === -1) throw new Error(`${fileName}: no question ${id}`)
    file.questions[i] = { ...question, id, packId: file.pack.id }
  }
  mutate?.(file)
  file.pack.contentHash = contentHash(file)
  writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
  console.log(`${fileName} · hash ${file.pack.contentHash}`)
}

/* =========================================================== engineering q1
 *
 * The blind adjudicator judged the steady-state question NOT materially
 * supported: conservation of energy settles it whatever the passage says, and
 * the passage merely agrees. It was written to get q1 off Figure 2's numbers,
 * which q2 consumes entirely; the fault was choosing a fact the reader already
 * has.
 *
 * The replacement turns on the source's own notation instead. This pack writes R
 * for a single layer and R_total for the wall, and a candidate who reads R as
 * the wall's resistance gets q2 wrong. Nothing outside the legend settles which
 * one R means here.
 */
patch('gam-engineering-thermal-resistance-001.json', {
  'gam-eng-tr-001-q1': {
    stem: 'In the formula given for the wall, the symbol R stands for which quantity?',
    options: [
      { id: 'a', text: 'The thermal resistance of one layer, per unit of area.' },
      { id: 'b', text: 'The thermal resistance of the whole wall, per unit of area.' },
      { id: 'c', text: 'The conductivity of the material that layer is made of.' },
      { id: 'd', text: 'The rate at which heat flows through one layer.' },
    ],
    correctOptionId: 'a',
    reasoning: 'retrieve',
    dependsOn: ['f1', 'p2'],
    supportSpans: [
      { blockId: 'f1', quote: 'thermal resistance of a layer per unit area, in square metre kelvin per watt' },
    ],
    explanation:
      'The legend beneath the formula gives R as the thermal resistance of a layer, per unit area. The wall as a whole has its own symbol, R_total, which the second formula divides into. Keeping the two apart is what the rest of the pack turns on: the layer resistances are what get added, and the total is what the heat flow is divided by.',
    refutations: {
      b: {
        blockId: 'p2',
        family: 'right-concept-wrong-scope',
        reason:
          'The wall as a whole is written R_total, and the text reaches it by adding the layers together. R on its own is one layer of that sum.',
      },
      c: {
        blockId: 'f1',
        family: 'swapped-quantities',
        reason:
          'Conductivity has its own symbol in the legend, lambda, and it is what the thickness is divided by to obtain R rather than being R itself.',
      },
      d: {
        blockId: 'f1',
        family: 'swapped-quantities',
        reason:
          'The rate of heat flow is Q in the legend, measured in watts. R is what opposes that flow, not the flow itself.',
      },
    },
    hints: [
      { level: 1, text: 'The legend under the formula gives a meaning for every symbol it uses.' },
      { level: 2, text: 'Two of the symbols in the formulas refer to resistance, and they do not mean the same thing.' },
      { level: 3, text: 'Look at which of the two the first formula produces from a thickness and a conductivity.' },
    ],
    difficulty: 'low',
    meta: { stepCount: 1, blockSpan: 2, transferDistance: 0, requiresExhibit: false },
  },
})

/* =========================================================== business administration q6
 *
 * Not a wrong answer — the adjudicator reached the intended one — but the stem
 * says "the workshop" directly after q5 introduces a different one, so the
 * referent is only settled by noticing that q5's workshop has no fixed costs.
 * A candidate should not have to reason about a sibling question to know what a
 * stem is talking about.
 */
patch('gam-business-administration-break-even-001.json', null, (file) => {
  const q6 = file.questions.find((q) => q.id === 'gam-ba-be-001-q6')
  q6.stem =
    'The workshop described in the source wants to end the period with a profit of 30,000 euros. ' +
    'At the price, variable cost and fixed costs given there, how many units must it sell?'
})
