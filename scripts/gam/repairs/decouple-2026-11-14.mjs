/**
 * Sibling-coupling repair, 14 November 2026 — the seven residual narrowing leaks.
 *
 * Same standard as the 7 September pass: a leak carried by an option set is
 * fixed by changing the option set; a leak from two questions turning on one
 * fact is fixed by changing what one of them asks. Rewording never fixes
 * either. Five questions change, two are left to be re-measured as converses.
 *
 * ECONOMICS (q4). ANSWER-AS-DISTRACTOR. q1/q2/q3 jointly establish that the
 *   cargo class fixes the rate per tonne, which let a reader discount option b
 *   ("the class the cargo falls in") without the source. The text does refute b
 *   itself — p4 says class makes no difference — but a distractor a sibling
 *   disposes of is doing no work. b becomes a condition about who performs the
 *   unloading: a near-miss on the key's own concept, since "handled by the
 *   port" is defined in p4 by where the cargo goes and not by whose hands move
 *   it. No sibling says anything about who unloads. The tonnage distractor
 *   stays, so p4's "neither does its tonnage" still refutes something.
 *
 * MATHEMATICS (q2). DOCTRINAL COUPLING. q2's option d proposed adjusting the
 *   figures "in proportion to the change in output" — a volume-scaling error,
 *   which is exactly the error q3's option b commits and q3's correct answer
 *   refutes. Reading q3 killed it. It stays an adjust-rather-than-re-measure
 *   error, which is what p4 rules out by name and what the explanation and
 *   hints are written against, but is re-anchored to the tooling's effect
 *   rather than to output. Volume now appears nowhere in q2's options, so
 *   there is nothing for q3's doctrine to carry across.
 *
 * NATURAL SCIENCES (q1). q3's stem asserts winter uniformity and q2 fixes the
 *   thermocline as a stratifying band, which between them make a summer depth
 *   gradient certain from the siblings alone and disposed of option d, "none of
 *   the depths shown". d becomes a fourth concrete depth — the surface, which
 *   the figure puts at 9.5 against the text's threshold of 5. Every option is
 *   now a depth that has to be read off the figure, which is a stronger item
 *   than one carrying an escape hatch a sibling could close.
 *
 * SOCIAL SCIENCES (q4). Two mechanisms, and the second is not an option fault.
 *   Option d ("contested answers were excluded") was refuted by q2's correct
 *   answer, which has contested answers coded and counted. Worse, q4 asked the
 *   reader to pick a condition from a list, so its option set was four
 *   procedural conditions — and that shape alone told a reader of q3 that the
 *   pack treats the agreement rate as a procedural statistic, which argued
 *   against q3's two validity-claim options. An option swap cannot fix the
 *   shape. So q4 stops enumerating conditions and applies p4 to a case: a
 *   supervisor shows the second coder the first's decisions on the difficult
 *   answers. The options are now outcomes rather than conditions, nothing is
 *   carried from q2, and the item moves from recognition to transfer, which
 *   also speaks to the pack's recognition-heavy flag.
 *
 * COMPUTATIONAL SCIENCES (q4). STEM PRESUPPOSITION. q3 asks which cache "met
 *   the smallest share of its requests without going to the slow store" — an
 *   ordinary comparison across the table's rows. That presupposition made two
 *   of q4's options improbable before any reasoning: option c said the figures
 *   "cannot be compared because the caches hold different numbers of records",
 *   and option d said a single day is "too short a period to be used at all" —
 *   either would void the read q3 requires. Both are replaced with objections
 *   that leave row-to-row comparison intact, so q3's stem no longer rules
 *   anything out here.
 *
 * LEFT TO BE MEASURED, not repaired: gam-math-tsi-001-q3 and gam-ss-ca-001-q3
 *   are the converses of the two repairs above. Each was rated a reinforcement
 *   of an independently determinable item rather than a decision, and each
 *   should weaken now that its partner no longer carries the doctrine across.
 *   Whether it weakens enough is for the re-adjudication to say, not for this
 *   script to assume.
 *
 * No key changes. No question is added or removed. The active set stays at 19.
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { contentHash } from '../lib/validate.mjs'

const PACKS = new URL('../../../content/gam/packs/', import.meta.url)

/** Replace one option's text and its refutation, leaving the key untouched. */
const swapOption = (q, id, text, refutation) => {
  const option = q.options.find((o) => o.id === id)
  if (!option) throw new Error(`${q.id}: no option ${id}`)
  if (id === q.correctOptionId) throw new Error(`${q.id}: refusing to rewrite the keyed option`)
  option.text = text
  q.refutations[id] = refutation
}

const edits = {
  'gam-economics-port-tariff-001': (qs) => {
    const q = qs.find((q) => q.id === 'gam-econ-pt-001-q4')
    swapOption(q, 'b', 'Whether the port’s own staff carried out the unloading.', {
      blockId: 'p4',
      family: 'plausible-but-unstated',
      reason:
        'The exemption turns on where the cargo goes — whether it leaves the port area — and the text says nothing about whose hands move it. “Handled by the port” is defined by that movement, not by who performs it.',
    })
    q.explanation =
      'The tariff is a charge for handling, so whether anything is owed comes before any question of how much. Cargo that passes between vessels without leaving the port area is never handled, and so sits outside the tariff altogether. The text names that condition exactly, and says in terms that tonnage makes no difference to it; each of the other options attaches a condition the text never attaches.'
    q.hints[2].text =
      'That paragraph names the condition exactly, and also names something that makes no difference to it.'
  },

  'gam-mathematics-two-stage-inspection-001': (qs) => {
    const q = qs.find((q) => q.id === 'gam-math-tsi-001-q2')
    swapOption(q, 'd', 'They may be adjusted once the new tooling’s effect on the first inspection is known.', {
      blockId: 'p4',
      family: 'contradicts-source',
      reason:
        'Adjustment is the other course the text rules out by name. Knowing the effect on the first inspection would not supply the second inspection’s figure in any case, since that is measured on whatever the first now passes on.',
    })
  },

  'gam-natural-sciences-lake-oxygen-001': (qs) => {
    const q = qs.find((q) => q.id === 'gam-ns-lox-001-q1')
    swapOption(q, 'd', 'At the surface.', {
      blockId: 'fig1',
      family: 'arithmetic-slip',
      reason:
        'The summer surface reading is the highest on the profile, at well over the stated threshold. Oxygen enters the lake at the surface, so this is the last place it runs short.',
    })
    q.hints[2].text =
      'Take the four depths offered in turn and ask whether the summer reading at each is above or below the threshold.'
  },

  'gam-social-sciences-coding-agreement-001': (qs) => {
    const q = qs.find((q) => q.id === 'gam-ss-ca-001-q4')
    q.stem =
      'A supervisor lets the second coder see the first coder’s decisions on the answers the first found difficult. According to the text, what follows for the pair’s figure?'
    q.options = [
      { id: 'a', text: 'It is not an agreement rate at all, because the two were no longer working unaware of each other.' },
      { id: 'b', text: 'It is still an agreement rate, since the first coder’s decisions were made independently.' },
      { id: 'c', text: 'It is still an agreement rate, provided the answers that were shown are reported alongside it.' },
      { id: 'd', text: 'It understates the pair’s agreement, since help was given only on the hardest answers.' },
    ]
    q.correctOptionId = 'a'
    q.dependsOn = ['p4', 'p1']
    q.supportSpans = [
      {
        blockId: 'p4',
        quote:
          'A coder who has seen the other coder’s decisions is no longer coding independently, and the pair’s figure is not an agreement rate at all.',
      },
      { blockId: 'p4', quote: 'The one condition the procedure rests on is that the two work unaware of each other.' },
      { blockId: 'p1', quote: 'two coders work on the same answers without seeing each other’s decisions' },
    ]
    q.explanation =
      'The text puts this categorically rather than as a matter of degree: a coder who has seen the other’s decisions is no longer coding independently, and the pair’s figure is then not an agreement rate at all. It makes no difference that only the difficult answers were shown, or that the first coder worked alone throughout — the statistic belongs to the pair, and one half of the pair was no longer working unaware.'
    q.refutations = {
      b: {
        blockId: 'p1',
        family: 'right-concept-wrong-scope',
        reason:
          'Double coding is defined as two coders working without seeing each other’s decisions. One of them working independently is half the condition, and the figure is a property of the pair rather than of either coder.',
      },
      c: {
        blockId: 'p4',
        family: 'plausible-but-unstated',
        reason:
          'The text offers no disclosure that rescues the figure. It says the figure is not an agreement rate at all, and attaches no reporting condition under which it would be.',
      },
      d: {
        blockId: 'p4',
        family: 'contradicts-source',
        reason:
          'This treats the figure as an agreement rate carrying a bias. The text’s position is that it is not one, so there is no true value for it to sit below.',
      },
    }
    q.hints = [
      { level: 1, text: 'One paragraph names a single condition and calls it the one the procedure rests on.' },
      { level: 2, text: 'Ask whether that condition is met for the pair when it is met for only one of the two coders.' },
      { level: 3, text: 'The text does not say the figure is distorted; look at how strongly it puts what the figure then is.' },
    ]
    q.reasoning = 'classify-scenario'
    q.meta = { stepCount: 2, blockSpan: 2, transferDistance: 3, requiresExhibit: false }
  },

  'gam-computational-sciences-cache-policy-001': (qs) => {
    const q = qs.find((q) => q.id === 'gam-cs-cp-001-q4')
    swapOption(q, 'c', 'The table gives hit rates but not what a miss costs, so it cannot show which design performs better.', {
      blockId: 'p3',
      family: 'plausible-but-unstated',
      reason:
        'What a miss costs is nowhere in the text. The objection it does raise is that a hit rate belongs to a pairing of cache and traffic, not that a further column is missing.',
    })
    swapOption(q, 'd', 'All four caches sat on one machine, so each design’s figure was affected by the others.', {
      blockId: 't1',
      family: 'plausible-but-unstated',
      reason:
        'The table records that the four share a machine and the text draws nothing from it. What it says would change the figures is the pattern of requests each cache met.',
    })
  },
}

let changed = 0
for (const [packId, edit] of Object.entries(edits)) {
  const url = new URL(`${packId}.json`, PACKS)
  const file = JSON.parse(readFileSync(url, 'utf8'))
  edit(file.questions)
  // Recompute, or Gate 1 fails on the stale hash — which is the hash doing its
  // job. Changing content without restamping is exactly what it exists to catch.
  file.pack.contentHash = contentHash(file)
  writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
  changed++
  console.log(`repaired ${packId} · hash ${file.pack.contentHash}`)
}
console.log(`\n${changed} pack(s) rewritten. Re-run: npm run verify:gam`)
