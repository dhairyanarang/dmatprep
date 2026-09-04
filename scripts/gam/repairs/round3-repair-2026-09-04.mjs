/**
 * Fifth pass, 4 September 2026 — the two concrete findings of the third
 * independent round.
 *
 *   DECISIVE LEAK  gam-hum-sc-001-q1. Two siblings' options glossed the very
 *   definitions q1 asks for: q3's key explained a failed proximity check as the
 *   author being "neither a witness nor told by one", and q6's options explained
 *   each check as they applied it. An adjudicator with no source at all read the
 *   definitions straight off them.
 *
 *   The repair strips the glosses. Both questions now offer bare verdicts and
 *   carry their reasoning in the refutations, where the candidate sees it only
 *   after answering — which is also closer to the terse option style of the
 *   official examples.
 *
 *   CORRECTNESS DEFECT  gam-eng-tr-001-q5. Distractor d reached the key's
 *   conclusion by wrong reasoning, so a candidate who checked only the direction
 *   of the effect could pick it and believe they were right. Its conclusion now
 *   differs from the key's.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const dir = new URL('../../../content/gam/packs/', import.meta.url)

function patch(fileName, replacements) {
  const url = new URL(fileName, dir)
  const file = JSON.parse(readFileSync(url, 'utf8'))
  for (const [id, q] of Object.entries(replacements)) {
    const i = file.questions.findIndex((x) => x.id === id)
    if (i === -1) throw new Error(`${fileName}: no question ${id}`)
    file.questions[i] = { ...q, id, packId: file.pack.id }
  }
  file.pack.contentHash = contentHash(file)
  writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
  console.log(`${fileName}: ${Object.keys(replacements).length} replaced · hash ${file.pack.contentHash}`)
}

patch('gam-humanities-source-checks-001.json', {
  'gam-hum-sc-001-q3': {
    stem:
      'A monk compiled his account of a battle sixty years after it took place, drawing on stories circulating in his monastery. He belonged to no party to the conflict and gained nothing from how the battle was remembered. Which check is most directly at issue, and what is its outcome?',
    options: [
      { id: 'a', text: 'The interest check, which the account fails.' },
      { id: 'b', text: 'The proximity check, which the account fares poorly on.' },
      { id: 'c', text: 'The attribution check, which the account fails.' },
      { id: 'd', text: 'The proximity check, which the account passes.' },
    ],
    correctOptionId: 'b',
    reasoning: 'classify-scenario',
    dependsOn: ['p3', 'p4', 'p2'],
    supportSpans: [
      { blockId: 'p3', quote: 'both are closer than a compiler assembling an account several generations later' },
    ],
    explanation:
      'The monk is at the far end of the chain the text describes: not a witness, not told by a participant, but a compiler working from what was in circulation two generations on. That is what the proximity check measures, and the account stands poorly on it. Nothing here fails: the monk had no stake, and the account is what it claims to be.',
    refutations: {
      a: {
        blockId: 'p4',
        family: 'right-concept-wrong-scope',
        reason:
          'The check that concerns motive is not at issue. The monk belonged to no party and gained nothing by the account being believed, so there is no stake for it to find.',
      },
      c: {
        blockId: 'p2',
        family: 'right-concept-wrong-scope',
        reason:
          'Nothing suggests the account is other than what it presents itself as being. Writing long after the events is not a false claim about who wrote it or when.',
      },
      d: {
        blockId: 'p3',
        family: 'wrong-direction-of-effect',
        reason:
          'The check is the right one and the verdict is the wrong way round. A compiler working from circulating stories stands at the furthest of the positions the text sets out.',
      },
    },
    hints: [
      { level: 1, text: 'Two of the details in the description bear on different checks; decide which of them the question is about.' },
      { level: 2, text: 'The detail about the monk belonging to no party disposes of one check rather than raising it.' },
      { level: 3, text: 'The text ranks three positions an author can occupy relative to what is described. Work out which one the monk occupies.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 3, blockSpan: 3, transferDistance: 2, requiresExhibit: false },
  },

  'gam-hum-sc-001-q6': {
    stem:
      'A pamphlet carries the name of a printer whose workshop is known to have been operating in the year the pamphlet bears, and it describes a riot the printer says he watched from his own window. The printer was in the pay of the city council, which the pamphlet praises for restoring order. According to the text, how do the three checks stand?',
    options: [
      { id: 'a', text: 'All three pass.' },
      { id: 'b', text: 'Attribution and proximity pass; the interest check does not.' },
      { id: 'c', text: 'Attribution passes; the proximity and interest checks both fail.' },
      { id: 'd', text: 'All three fail.' },
    ],
    correctOptionId: 'b',
    reasoning: 'classify-scenario',
    dependsOn: ['p1', 'p2', 'p3', 'p4', 'p6'],
    supportSpans: [
      { blockId: 'p1', quote: 'They are independent of one another: a document may pass one and fail another' },
      { blockId: 'p2', quote: 'The attribution check asks whether the document is what it presents itself as being' },
      { blockId: 'p4', quote: 'The interest check asks what the author stood to gain or lose if the account were believed.' },
    ],
    explanation:
      'The workshop dates confirm the pamphlet is what it presents itself as being, so the first check passes. The printer describes what he saw himself, which is the closest position the text recognises, so the second passes. He was paid by the party the pamphlet praises and stood to gain if his account of its conduct were believed, so it is the third that fails. The text insists the three are applied separately, and here they come apart.',
    refutations: {
      a: {
        blockId: 'p4',
        family: 'right-concept-wrong-scope',
        reason:
          'Two of the three details settle two of the checks favourably. The third detail — who was paying the printer, and what the pamphlet says about them — is left unaccounted for.',
      },
      c: {
        blockId: 'p3',
        family: 'right-concept-wrong-scope',
        reason:
          'The text states that motive is unaffected by how near the author stood to the events. Being paid does not move an eyewitness further from what he saw.',
      },
      d: {
        blockId: 'p6',
        family: 'contradicts-source',
        reason:
          'A failed check does not condemn a document outright, and it certainly does not carry the other two down with it. The text says a document may pass one and fail another.',
      },
    },
    hints: [
      { level: 1, text: 'Take the three checks one at a time rather than forming a single impression of the pamphlet.' },
      { level: 2, text: 'Each of the three details in the description bears on exactly one of them.' },
      { level: 3, text: 'The text warns explicitly against letting one check carry another, in either direction.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 4, blockSpan: 4, transferDistance: 3, requiresExhibit: false },
  },
})

patch('gam-engineering-thermal-resistance-001.json', {
  'gam-eng-tr-001-q5': {
    stem:
      'A builder proposes moving the insulation layer of the wall in Figure 2 from the cool side to the warm side, keeping both layers otherwise identical. According to the text, what effect does this have on the steady rate of heat flow?',
    options: [
      { id: 'a', text: 'It decreases, because insulation works better on the warm side.' },
      { id: 'b', text: 'It increases, because the brick can then store more heat.' },
      { id: 'c', text: 'It is unchanged, because the resistances are added and their order does not affect the total.' },
      { id: 'd', text: 'It decreases, because the warm side now meets the greater resistance first.' },
    ],
    correctOptionId: 'c',
    reasoning: 'qualitative-inference',
    dependsOn: ['p2'],
    supportSpans: [
      { blockId: 'p2', quote: 'Because the resistances are added, the order in which the layers are arranged does not change the total.' },
    ],
    explanation:
      'The wall behaves like a chain: the same heat passes through each layer in turn and the layers’ resistances are added. Addition does not depend on the order of what is added, so the total resistance — and with it the rate of flow — is exactly what it was.',
    refutations: {
      a: {
        blockId: 'p2',
        family: 'plausible-but-unstated',
        reason:
          'The text gives insulation no special relationship to the warm side. Its resistance is its thickness divided by its conductivity wherever it sits.',
      },
      b: {
        blockId: 'p2',
        family: 'plausible-but-unstated',
        reason:
          'Storage plays no part in the steady state, where the rate of flow no longer changes with time and the same heat passes through every layer.',
      },
      d: {
        blockId: 'p2',
        family: 'plausible-but-unstated',
        reason:
          'Which layer the heat meets first is exactly what the text says makes no difference, because the resistances are added rather than applied in sequence.',
      },
    },
    hints: [
      { level: 1, text: 'Find the sentence that says what the total resistance is made of.' },
      { level: 2, text: 'The operation that combines the layers has a property worth naming.' },
      { level: 3, text: 'Ask whether the order of the terms in a sum can change the sum.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 2, blockSpan: 1, transferDistance: 1, requiresExhibit: false },
  },
})
