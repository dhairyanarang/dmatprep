/**
 * Fourth pass, 4 September 2026 — reverting a repair that made things worse.
 *
 * Pass three rewrote engineering q3 to take as given that the brick layer
 * contributes the smaller share of the resistance, and to ask why. That closed
 * the coupling with q4 in one direction and opened a worse one in the other: the
 * stem now stated the very fact q4's answer turns on, and the adjudicator used
 * it to solve each of q4's options for its implied resistance ratio and discard
 * three of them.
 *
 * q3 goes back to asking which layer dominates. A candidate does not know q3's
 * key, so an answer that happens to agree with q4 gives nothing away — which a
 * stem that asserts it does.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const url = new URL('../../../content/gam/packs/gam-engineering-thermal-resistance-001.json', import.meta.url)
const file = JSON.parse(readFileSync(url, 'utf8'))
const i = file.questions.findIndex((q) => q.id === 'gam-eng-tr-001-q3')

file.questions[i] = {
  id: 'gam-eng-tr-001-q3',
  packId: file.pack.id,
  stem: 'In the wall shown in Figure 2, which layer contributes the greater share of the total thermal resistance, and why?',
  options: [
    { id: 'a', text: 'The brick layer, because it is the thicker of the two.' },
    { id: 'b', text: 'The insulation layer, because its conductivity is much lower.' },
    { id: 'c', text: 'The brick layer, because its conductivity is higher.' },
    { id: 'd', text: 'Both contribute equally, because the same heat passes through each of them.' },
  ],
  correctOptionId: 'b',
  reasoning: 'qualitative-inference',
  dependsOn: ['fig2', 'f1', 'p2'],
  supportSpans: [
    { blockId: 'f1', quote: 'R = d / lambda' },
    { blockId: 'p2', quote: 'A layer of low conductivity contributes a large resistance even when it is thin, while a thick layer of high conductivity may contribute very little.' },
    { blockId: 'fig2', quote: 'thickness 0.08 m, conductivity 0.05 watts per metre kelvin' },
  ],
  explanation:
    'Resistance is thickness divided by conductivity, so a layer can win on either count. The brick is three times as thick, which pulls one way, but it conducts twelve times as well, which pulls much harder the other. Its resistance is 0.4 against the insulation’s 1.6, a fifth of the total against four fifths.',
  refutations: {
    a: {
      blockId: 'p2',
      family: 'right-concept-wrong-scope',
      reason:
        'Thickness is only the numerator. The text says directly that a thick layer of high conductivity may contribute very little, which is what happens here.',
    },
    c: {
      blockId: 'f1',
      family: 'wrong-direction-of-effect',
      reason:
        'Conductivity is the divisor, so a higher conductivity gives a smaller resistance. Being the better conductor is what makes the brick contribute less, not more.',
    },
    d: {
      blockId: 'p2',
      family: 'plausible-but-unstated',
      reason:
        'The same heat does pass through both layers, and that is precisely why their resistances add rather than average. Equal flow says nothing about equal resistance.',
    },
  },
  hints: [
    { level: 1, text: 'Write down what a single layer’s resistance is made of before comparing the two layers.' },
    { level: 2, text: 'The two layers differ in both quantities, and by very different factors.' },
    { level: 3, text: 'Compare the ratio of the two thicknesses with the ratio of the two conductivities.' },
  ],
  difficulty: 'medium',
  meta: { stepCount: 2, blockSpan: 3, transferDistance: 1, requiresExhibit: true },
}

file.pack.contentHash = contentHash(file)
writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
console.log(`engineering q3 reverted · hash ${file.pack.contentHash}`)
