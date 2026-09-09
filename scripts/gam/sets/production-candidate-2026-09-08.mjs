/**
 * GAM production candidate, 8 September 2026 — the independent-source architecture.
 *
 * WHAT THE THREE EARLIER FAILURES TAUGHT, AND WHAT IS DONE ABOUT EACH.
 *
 *   1. NUMERIC RECONSTRUCTION (operation-counts, retired). Every numeric option
 *      was a closed-form function of one small table, so seven option lists
 *      became seven equations and recovered the table entire.
 *      → At most ONE question per pack has options that are a function of any
 *        given source datum, and each numeric question draws on a DIFFERENT row.
 *
 *   2. SHARED-PARAMETER COUPLING (engineering). Several questions computed from
 *      one worked example, so each disclosed inputs the others needed.
 *      → Numeric questions take their case from their own stem or from a row no
 *        sibling touches.
 *
 *   3. SIBLING ANSWER LEAKAGE (step-rebate, q5 retired). One question's option
 *      magnitudes revealed the scheme's scale, which decided another.
 *      → No two questions in a pack offer options on the same scale or in the
 *        same units unless they concern different entities.
 *
 *   4. CONVENTION-AS-CONSTANT (small-pack experiment, mathematics). A pack with
 *      no numeric constants still leaked: one option list revealed WHICH
 *      convention the source had stated, which was the only thing the source
 *      supplied.
 *      → At most one question per pack has an option set that discriminates
 *        between candidate conventions.
 *
 *   5. DOCTRINAL COUPLING (small-pack experiment, social sciences). Every
 *      question asked "is this sound?", so the pack's general posture — learned
 *      from any one answer — eliminated options in all the others.
 *      → NO TWO QUESTIONS IN A PACK SHARE AN ANSWER SHAPE. One asks for a value,
 *        one names an entity, one says what a figure describes, one says what
 *        must be done. A distractor must be wrong for a reason local to its own
 *        question, never because the pack holds a doctrine another answer states.
 *
 * THE ARCHITECTURE. Each source states one governing rule ONCE, and then supplies
 * a set of independent cases — four production lines, two seasons, four cargo
 * classes, four coder pairs, four caches. Questions are partitioned across the
 * cases. The rule is shared, which is legitimate shared context and is what the
 * official Exercise 3 does; the FACTS are private to each question, so learning
 * one answer leaves the next still needing the source.
 *
 * 4 and 5 questions are an authoring range, not a rule. The official material
 * states no per-exercise count and its own exercises carry 8, 6, 7 and 5.
 * Nothing here encodes a count as a gate.
 */
import { writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const dir = new URL('../../../content/gam/sets/production-candidate-2026-09-08/packs/', import.meta.url)

const NOTES =
  'Built on the independent-source architecture of 8 September 2026: one governing rule stated once, then a ' +
  'set of independent cases with the questions partitioned across them, so that no sibling answer supplies a ' +
  'fact another question needs. No two questions in the pack share an answer shape, and at most one has ' +
  'options that are a function of any given source datum. Every scheme and every figure is invented here.'

function emit(pack, questions) {
  const file = {
    pack: {
      ...pack,
      provenance: {
        originality: 'original',
        draftedBy: 'production-candidate-2026-09-08',
        reviewStatus: 'automated-pass',
        notes: NOTES,
        ...(pack.provenanceExtra ?? {}),
      },
    },
    questions: questions.map(({ qid, ...q }, i) => ({
      ...q,
      id: `${pack.idStem}-${qid ?? `q${i + 1}`}`,
      packId: pack.id,
    })),
  }
  delete file.pack.idStem
  delete file.pack.provenanceExtra
  file.pack.contentHash = contentHash(file)
  writeFileSync(new URL(`${pack.id}.json`, dir), `${JSON.stringify(file, null, 2)}\n`)
  console.log(`${pack.id}: ${questions.length} q · hash ${file.pack.contentHash}`)
}

/* -------------------------------------------------------------- MATHEMATICS */
// Cases: four production lines, each with its own pair of rates. q1 uses Line B
// and nothing else does; q2 asks what Line C's second figure DESCRIBES, not its
// value; q3 is about volume and needs no row; q4 names a line and discloses no
// rate. Four answer shapes: a count, a description, an effect, a name.

emit(
  {
    id: 'gam-mathematics-two-stage-inspection-001',
    idStem: 'gam-math-tsi-001',
    domain: 'mathematics',
    title: 'A two-stage inspection',
    defines: ['flag rate', 'rejection rate', 'two-stage inspection'],
    blocks: [
      { kind: 'heading', id: 'h1', text: 'A two-stage inspection' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'Every item made on a line goes through a first inspection, and a proportion of items is flagged there for a closer look. This proportion is the line’s flag rate. Only flagged items go on to the second inspection, where some are rejected and the rest are returned to stock. The share of all the line’s items that end up rejected is therefore the flag rate applied first and the rejection rate applied to what it leaves.',
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'The rejection rate is quoted as a proportion of the items that reach the second inspection, and not as a proportion of everything the line makes. A line with a high rejection rate may reject very few items overall if it flags almost nothing at the first inspection, and this is the commonest misreading of the table below.',
      },
      {
        kind: 'table',
        id: 't1',
        caption: 'Flag and rejection rates for four production lines.',
        columns: ['Line', 'Flag rate', 'Rejection rate'],
        rows: [
          ['Line A', '12 per cent', '25 per cent'],
          ['Line B', '8 per cent', '15 per cent'],
          ['Line C', '20 per cent', '5 per cent'],
          ['Line D', '5 per cent', '40 per cent'],
        ],
      },
      {
        kind: 'paragraph',
        id: 'p3',
        text:
          'Both rates are properties of the line as it is currently set up. Neither moves with the number of items put through it, so a line that runs for longer rejects more items but does not reject a larger share of them.',
      },
      {
        kind: 'paragraph',
        id: 'p4',
        text:
          'The rates in the table were measured on the tooling in use at the time. A change of tooling alters what the first inspection catches, and the figures must then be measured again rather than adjusted or carried across.',
      },
    ],
  },
  [
    {
      stem: 'Line B runs 5,000 items. How many of them are rejected at the second inspection?',
      options: [
        { id: 'a', text: '6' },
        { id: 'b', text: '60' },
        { id: 'c', text: '400' },
        { id: 'd', text: '750' },
      ],
      correctOptionId: 'b',
      reasoning: 'apply-formula',
      dependsOn: ['t1', 'p1'],
      supportSpans: [
        { blockId: 't1', quote: 'Line B' },
        { blockId: 'p1', quote: 'the flag rate applied first and the rejection rate applied to what it leaves' },
      ],
      explanation:
        'Only flagged items reach the second inspection, so the two rates are applied one after the other rather than either being applied to the whole run. Line B flags eight items in every hundred, which out of 5,000 is 400 items; of those 400, fifteen in every hundred are rejected.',
      refutations: {
        a: {
          blockId: 'p1',
          family: 'arithmetic-slip',
          reason:
            'This is the right calculation with a decimal place lost. Both rates are percentages, so each division by a hundred has to be carried through, and only one has been.',
        },
        c: {
          blockId: 'p1',
          family: 'right-concept-wrong-scope',
          reason:
            'This is the number of items Line B sends to the second inspection, not the number it rejects there. Most flagged items are returned to stock.',
        },
        d: {
          blockId: 'p2',
          family: 'misapplied-formula',
          reason:
            'This applies the rejection rate to the whole run. The text is explicit that the rate is quoted against the items reaching the second inspection, which is a small part of what the line makes.',
        },
      },
      computation: { expression: '5000 * 0.08 * 0.15', expected: 60, unit: 'items' },
      hints: [
        { level: 1, text: 'Work out how many of the 5,000 items reach the second inspection before doing anything else.' },
        { level: 2, text: 'The second rate is not applied to everything the line makes — find the sentence that says what it is applied to.' },
        { level: 3, text: 'Take the flagged items you have just counted, and apply the second rate to that number alone.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 3, blockSpan: 2, transferDistance: 1, requiresExhibit: true },
    },

    {
      stem: 'Line D is fitted with new tooling. According to the text, what must be done with the figures Table 1 gives for it?',
      options: [
        { id: 'a', text: 'They must be measured again.' },
        { id: 'b', text: 'They may be carried across unchanged, since it is the same line.' },
        { id: 'c', text: 'Only the rejection rate need be measured again.' },
        { id: 'd', text: 'They may be adjusted in proportion to the change in output.' },
      ],
      correctOptionId: 'a',
      reasoning: 'classify-scenario',
      dependsOn: ['p4'],
      supportSpans: [
        { blockId: 'p4', quote: 'the figures must then be measured again rather than adjusted or carried across' },
        { blockId: 'p4', quote: 'A change of tooling alters what the first inspection catches' },
      ],
      explanation:
        'The text ties the figures to the tooling they were measured on, and rules out both of the shortcuts a reader might reach for: they are not to be adjusted, and they are not to be carried across. New tooling changes what the first inspection catches, so the measurement has to be made again.',
      refutations: {
        b: {
          blockId: 'p4',
          family: 'contradicts-source',
          reason:
            'The text names carrying the figures across as one of the two things not to do. What was measured belongs to the tooling in use at the time, not to the line in the abstract.',
        },
        c: {
          blockId: 'p4',
          family: 'right-concept-wrong-scope',
          reason:
            'The text says the tooling alters what the first inspection catches, which changes the group the second inspection then sees. Neither figure survives the change untouched.',
        },
        d: {
          blockId: 'p4',
          family: 'plausible-but-unstated',
          reason:
            'Adjustment is the other course the text rules out, and output is not what changed in any case. The text offers no factor by which any adjustment could be made.',
        },
      },
      hints: [
        { level: 1, text: 'One short paragraph deals with what happens when the equipment changes.' },
        { level: 2, text: 'That paragraph rules out two courses of action by name; find them.' },
        { level: 3, text: 'Ask whether a change to the first inspection can leave the second inspection’s figure untouched.' },
      ],
      difficulty: 'low',
      meta: { stepCount: 1, blockSpan: 1, transferDistance: 1, requiresExhibit: false },
    },

    {
      stem:
        'Line A is scheduled to run three times as many items next month, with no other change. According to the text, what happens to the share of its items that are rejected?',
      options: [
        { id: 'a', text: 'It is unchanged.' },
        { id: 'b', text: 'It trebles, along with the number of items.' },
        { id: 'c', text: 'It falls, because the first inspection is spread more thinly.' },
        { id: 'd', text: 'It cannot be said without knowing how many items the line rejected before.' },
      ],
      correctOptionId: 'a',
      reasoning: 'sensitivity',
      dependsOn: ['p3'],
      supportSpans: [
        { blockId: 'p3', quote: 'Neither moves with the number of items put through it, so a line that runs for longer rejects more items but does not reject a larger share of them.' },
      ],
      explanation:
        'The question asks about a share, and the text separates that from a count in as many words. Three times the items means three times the rejections, but both grow together, so the proportion they stand in is exactly what it was. Nothing about the line’s set-up has changed.',
      refutations: {
        b: {
          blockId: 'p3',
          family: 'swapped-quantities',
          reason:
            'The number of rejected items does treble. The share is that number set against a run which has trebled as well, so it stays put.',
        },
        c: {
          blockId: 'p3',
          family: 'plausible-but-unstated',
          reason:
            'Nothing in the text makes either rate depend on how hard the inspection is working. Both are described as properties of the line’s set-up.',
        },
        d: {
          blockId: 'p3',
          family: 'plausible-but-unstated',
          reason:
            'A share is a ratio, and it can be stated from the rates alone without any count of past rejections. The text gives both rates as properties of the line’s current set-up.',
        },
      },
      hints: [
        { level: 1, text: 'Notice that the question asks about a share and not about a number of items.' },
        { level: 2, text: 'The text states directly what does and does not move when a line runs for longer.' },
        { level: 3, text: 'If both the rejections and the run grow by the same factor, ask what happens to the ratio between them.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },

    {
      stem: 'Which line sends the largest share of its items on to the second inspection?',
      options: [
        { id: 'a', text: 'Line A' },
        { id: 'b', text: 'Line B' },
        { id: 'c', text: 'Line C' },
        { id: 'd', text: 'Line D' },
      ],
      correctOptionId: 'c',
      reasoning: 'read-exhibit',
      dependsOn: ['t1', 'p1'],
      supportSpans: [
        { blockId: 'p1', quote: 'Only flagged items go on to the second inspection' },
        { blockId: 't1', quote: 'Flag rate' },
      ],
      explanation:
        'What reaches the second inspection is what the first inspection flags, so the question is answered by the flag-rate column alone and the rejection rates play no part in it. Reading down that column, one line flags a larger share than any other.',
      refutations: {
        a: {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'This line flags a substantial share, and it is the second largest in that column rather than the largest.',
        },
        b: {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'This line flags one of the smaller shares in the table, so relatively little of its output ever reaches the second inspection.',
        },
        d: {
          blockId: 't1',
          family: 'swapped-quantities',
          reason:
            'This line has much the highest rejection rate, which is the other column. The rejection rate decides what happens to flagged items, not how many are flagged.',
        },
      },
      hints: [
        { level: 1, text: 'Only one of the two columns has any bearing on this question.' },
        { level: 2, text: 'Ask what decides whether an item reaches the second inspection at all.' },
        { level: 3, text: 'Read down the flag-rate column and ignore what happens afterwards.' },
      ],
      difficulty: 'low',
      meta: { stepCount: 1, blockSpan: 2, transferDistance: 1, requiresExhibit: true },
    },
  ],
)

/* --------------------------------------------------------- NATURAL SCIENCES */
// Cases partitioned by season. q1 reads the summer profile against a stated
// threshold; q3 concerns winter and needs no reading at all; q2 is a definition
// and q4 an instruction. Learning that winter is uniform says nothing about
// where the summer profile falls, and vice versa.

emit(
  {
    id: 'gam-natural-sciences-lake-oxygen-001',
    idStem: 'gam-ns-lox-001',
    domain: 'natural-sciences',
    title: 'Oxygen in a lake, by depth and season',
    defines: ['thermocline', 'dissolved oxygen'],
    blocks: [
      { kind: 'heading', id: 'h1', text: 'Oxygen in a lake, by depth and season' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'Dissolved oxygen enters a lake at its surface, from the air and from plants growing in the lit upper water. It is consumed near the bottom, where material that has sunk is broken down. Between the two lies the thermocline, a band of depth across which the temperature falls sharply; water above it and water below it do not readily mix across that band.',
      },
      {
        kind: 'figure',
        id: 'fig1',
        caption: 'Figure 1. Dissolved oxygen against depth, in milligrams per litre, on two dates.',
        spec: {
          type: 'line-chart',
          xLabel: 'Depth in metres',
          yLabel: 'Dissolved oxygen in milligrams per litre',
          series: [
            { id: 'summer', label: 'Summer', points: [[0, 9.5], [4, 9.0], [6, 8.5], [8, 4.0], [12, 2.5], [16, 1.5]] },
            { id: 'winter', label: 'Winter', points: [[0, 11.0], [4, 10.8], [8, 10.6], [12, 10.5], [16, 10.4]] },
          ],
          annotations: [
            { label: 'Summer readings', detail: 'about 9.5 at the surface, 9.0 at four metres, 8.5 at six metres, 4.0 at eight metres and 1.5 at sixteen' },
            { label: 'Winter readings', detail: 'close to 11 at every depth from the surface down to sixteen metres' },
            { label: 'The summer thermocline', detail: 'lies between six and eight metres' },
          ],
        },
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'In summer the thermocline holds the deep water apart from the surface, so the oxygen used up below it is not replaced and falls away as the season goes on. In winter the surface water cools until it is no denser than the water beneath, the lake turns over from top to bottom, and oxygen is carried down with it, so a winter profile is close to uniform at every depth.',
      },
      {
        kind: 'paragraph',
        id: 'p3',
        text:
          'A trout needs at least five milligrams of oxygen per litre and cannot remain where there is less than that, whatever the temperature suits it.',
      },
      {
        kind: 'paragraph',
        id: 'p4',
        text:
          'Both profiles were recorded at dawn, when a lake’s oxygen is at its lowest for the day: plants have consumed oxygen through the night and have not yet begun to produce it. A reading taken at midday runs higher for that reason alone, and cannot be set against these figures without allowing for the hour.',
      },
    ],
  },
  [
    {
      stem: 'Which of these depths, if any, holds too little oxygen for trout in summer?',
      options: [
        { id: 'a', text: 'Four metres' },
        { id: 'b', text: 'Six metres' },
        { id: 'c', text: 'Eight metres' },
        { id: 'd', text: 'None of the depths shown' },
      ],
      correctOptionId: 'c',
      reasoning: 'read-exhibit',
      dependsOn: ['fig1', 'p3'],
      supportSpans: [
        { blockId: 'p3', quote: 'A trout needs at least five milligrams of oxygen per litre and cannot remain where there is less than that' },
        { blockId: 'fig1', quote: '4.0 at eight metres' },
      ],
      explanation:
        'Two things have to be brought together: the threshold the text states for trout, and the summer readings at the depths offered. At four and six metres the summer water is well above the threshold. Between six and eight metres the profile falls away steeply, and by eight metres it has dropped below what the text says a trout can live in.',
      refutations: {
        a: {
          blockId: 'fig1',
          family: 'arithmetic-slip',
          reason:
            'The summer reading at this depth is nearly twice the threshold. It is close to the surface value, because the steep fall has not yet begun.',
        },
        b: {
          blockId: 'fig1',
          family: 'arithmetic-slip',
          reason:
            'This is the last depth before the fall, and the water there still holds well over the stated threshold. It is the depth at which the thermocline begins, not where the oxygen has gone.',
        },
        d: {
          blockId: 'p3',
          family: 'contradicts-source',
          reason:
            'The summer profile does drop below the threshold within the range shown, which is the whole point of the contrast the figure draws between the two seasons.',
        },
      },
      hints: [
        { level: 1, text: 'The text gives a single number that decides this, and the figure gives the readings to compare it with.' },
        { level: 2, text: 'Only the summer profile is in question; the winter one is a different date.' },
        { level: 3, text: 'Take the three depths offered in turn and ask whether the summer reading at each is above or below the threshold.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 2, transferDistance: 1, requiresExhibit: true },
    },

    {
      stem: 'According to the text, what is the thermocline?',
      options: [
        { id: 'a', text: 'The depth below which no light reaches.' },
        { id: 'b', text: 'A band of depth across which the temperature falls sharply.' },
        { id: 'c', text: 'The depth at which oxygen first falls below what fish require.' },
        { id: 'd', text: 'The layer in which sunken material is broken down.' },
      ],
      correctOptionId: 'b',
      reasoning: 'retrieve',
      dependsOn: ['p1'],
      supportSpans: [
        { blockId: 'p1', quote: 'the thermocline, a band of depth across which the temperature falls sharply' },
      ],
      explanation:
        'The text defines the thermocline by temperature and by nothing else. Its consequences for oxygen follow from that definition — water above and below it do not readily mix — but the definition itself is thermal, which is what the name says.',
      refutations: {
        a: {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'Light is mentioned only as one of the ways oxygen enters the upper water. The text nowhere ties the thermocline to a depth of light.',
        },
        c: {
          blockId: 'p3',
          family: 'right-concept-wrong-scope',
          reason:
            'This confuses the definition with one of its effects, and with a threshold given for a particular fish. The thermocline sits where it sits whether or not any fish is present.',
        },
        d: {
          blockId: 'p1',
          family: 'right-concept-wrong-scope',
          reason:
            'Breakdown of sunken material is what happens near the bottom and is why oxygen is consumed there. It is below the thermocline, not the thermocline itself.',
        },
      },
      hints: [
        { level: 1, text: 'The definition is given in a single clause, in the first paragraph.' },
        { level: 2, text: 'Ask what quantity the name of the band itself refers to.' },
        { level: 3, text: 'Separate what the band is from what follows from it for the water on either side.' },
      ],
      difficulty: 'low',
      meta: { stepCount: 1, blockSpan: 1, transferDistance: 1, requiresExhibit: false },
    },

    {
      stem:
        'According to the text, why is a lake’s oxygen close to the same at every depth in winter?',
      options: [
        { id: 'a', text: 'Because cold water holds more oxygen, so even the deep water is well supplied.' },
        { id: 'b', text: 'Because little material sinks in winter, so almost no oxygen is consumed near the bottom.' },
        { id: 'c', text: 'Because the surface water cools until the lake turns over and carries oxygen down.' },
        { id: 'd', text: 'Because the thermocline moves to the bottom in winter and stops mixing there.' },
      ],
      correctOptionId: 'c',
      reasoning: 'qualitative-inference',
      dependsOn: ['p2'],
      supportSpans: [
        { blockId: 'p2', quote: 'the surface water cools until it is no denser than the water beneath, the lake turns over from top to bottom, and oxygen is carried down with it' },
      ],
      explanation:
        'The text gives a mechanism rather than a property. What changes in winter is not how much oxygen the water can hold but whether the water moves: once the surface has cooled to the density of what lies below, the whole lake circulates, and circulation is what carries surface oxygen to the bottom.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'plausible-but-unstated',
          reason:
            'Cold water holding more oxygen is true of lakes and is not the reason the text gives. It would raise the readings everywhere without explaining why the deep water stops being cut off.',
        },
        b: {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'The text says nothing about how much material sinks in one season or another. Its account of winter turns on movement of the water, not on a pause in decay.',
        },
        d: {
          blockId: 'p2',
          family: 'contradicts-source',
          reason:
            'The thermocline does not descend in this account; the temperature difference that sustains it disappears, which is why the lake can turn over at all.',
        },
      },
      hints: [
        { level: 1, text: 'The text explains winter by something the water does, not by something it is.' },
        { level: 2, text: 'Ask what has to become true of the surface water before the lake can circulate.' },
        { level: 3, text: 'Density is doing the work in the passage; find the sentence where it appears.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },

    {
      stem:
        'A colleague measures the same lake at midday and wants to set the result against Figure 1. According to the text, what does that require?',
      options: [
        { id: 'a', text: 'Nothing; a reading is a reading, whatever the hour.' },
        { id: 'b', text: 'Allowing for the hour, since the figures were taken when oxygen is at its daily lowest.' },
        { id: 'c', text: 'Taking the midday reading below the thermocline, where the hour makes no difference.' },
        { id: 'd', text: 'Repeating the measurement in the other season before either can be used.' },
      ],
      correctOptionId: 'b',
      reasoning: 'classify-scenario',
      dependsOn: ['p4'],
      supportSpans: [
        { blockId: 'p4', quote: 'cannot be set against these figures without allowing for the hour' },
        { blockId: 'p4', quote: 'recorded at dawn, when a lake’s oxygen is at its lowest for the day' },
      ],
      explanation:
        'Both profiles share a condition the reader would not guess: they were taken at dawn, at the daily minimum. A midday figure is higher for that reason alone, so any difference between it and the chart would be partly an artefact of the clock. The text asks for that to be allowed for, not for the comparison to be abandoned.',
      refutations: {
        a: {
          blockId: 'p4',
          family: 'contradicts-source',
          reason:
            'The text states the opposite, and gives the mechanism: plants consume oxygen overnight and only begin producing it once there is light.',
        },
        c: {
          blockId: 'p4',
          family: 'plausible-but-unstated',
          reason:
            'The text makes no claim that the daily swing is confined to the surface. It attributes the swing to plants and to the hour, without exempting any depth.',
        },
        d: {
          blockId: 'p2',
          family: 'right-concept-wrong-scope',
          reason:
            'Season is a real distinction in this text and it is not the one at issue. The obstacle named here is the time of day.',
        },
      },
      hints: [
        { level: 1, text: 'Both profiles share a condition stated only once; find it.' },
        { level: 2, text: 'Ask what is special about the hour at which the readings were taken.' },
        { level: 3, text: 'Decide whether the text rules the comparison out or attaches a condition to it.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },
  ],
)

/* ---------------------------------------------------------------- ECONOMICS */
// Cases: four cargo classes. Only q1 is numeric and it uses one class; q2 states
// the minimum rule with no figures; q3 names a class; q4 names which factor
// decides. No option list carries a rate a sibling needs.

emit(
  {
    id: 'gam-economics-port-tariff-001',
    idStem: 'gam-econ-pt-001',
    domain: 'economics',
    title: 'A port’s tariff for handling cargo',
    defines: ['handling fee', 'class minimum', 'transhipped'],
    blocks: [
      { kind: 'heading', id: 'h1', text: 'A port’s tariff for handling cargo' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'The port charges a handling fee on cargo it lands. The fee is worked out on the tonnage of the consignment at a rate that depends on the class the cargo falls in, and each class also carries a minimum charge.',
      },
      {
        kind: 'table',
        id: 't1',
        caption: 'The classes of cargo, with the rate and the minimum for each.',
        columns: ['Class', 'Rate per tonne', 'Class minimum'],
        rows: [
          ['General', '4 euros', '200 euros'],
          ['Bulk grain', '2 euros', '300 euros'],
          ['Refrigerated', '9 euros', '450 euros'],
          ['Hazardous', '15 euros', '600 euros'],
        ],
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'Where the tonnage produces a fee below the class minimum, the minimum is charged in its place. The minimum is never added to the tonnage fee, and a consignment is never charged both.',
      },
      {
        kind: 'paragraph',
        id: 'p3',
        text:
          'A part tonne is rounded up to the next whole tonne before the rate is applied, however small the part.',
      },
      {
        kind: 'paragraph',
        id: 'p4',
        text:
          'Cargo that is transhipped, meaning that it passes between vessels without leaving the port area, is not handled by the port and pays nothing at all. Its class makes no difference to that, and neither does its tonnage.',
      },
    ],
  },
  [
    {
      stem: 'A consignment of 120.4 tonnes of general cargo is landed. What is the handling fee?',
      options: [
        { id: 'a', text: '200 euros' },
        { id: 'b', text: '480 euros' },
        { id: 'c', text: '481.60 euros' },
        { id: 'd', text: '484 euros' },
      ],
      correctOptionId: 'd',
      reasoning: 'apply-formula',
      dependsOn: ['t1', 'p3', 'p1'],
      supportSpans: [
        { blockId: 'p3', quote: 'A part tonne is rounded up to the next whole tonne before the rate is applied, however small the part.' },
        { blockId: 't1', quote: 'General' },
        { blockId: 'p1', quote: 'The fee is worked out on the tonnage of the consignment at a rate that depends on the class the cargo falls in' },
      ],
      explanation:
        'The rounding rule comes first and it goes upward however small the fraction, so the tonnage charged is 121 rather than 120.4 or 120. The general rate is then applied to that figure. The result is comfortably above the class minimum, so the minimum does not come into it.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'right-concept-wrong-scope',
          reason:
            'This charges the class minimum. The minimum takes over only when the tonnage fee falls below it, and here the tonnage fee is more than twice that figure.',
        },
        b: {
          blockId: 'p3',
          family: 'wrong-direction-of-effect',
          reason:
            'This rounds the part tonne down. The text says the rounding is upward, and says so in terms that leave no room for a small fraction to be dropped.',
        },
        c: {
          blockId: 'p3',
          family: 'misapplied-formula',
          reason:
            'This applies the rate to the tonnage as landed, without rounding at all. The rule is that the rounding happens first and the rate is applied to the whole tonne.',
        },
      },
      computation: { expression: '121 * 4', expected: 484, unit: 'euros' },
      hints: [
        { level: 1, text: 'Two rules apply here, and one of them has to be used before the other.' },
        { level: 2, text: 'Settle the tonnage the port will charge for before looking up any rate.' },
        { level: 3, text: 'Once you have a fee, check it against the class minimum to see whether the minimum changes anything.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 3, blockSpan: 3, transferDistance: 1, requiresExhibit: true },
    },

    {
      stem:
        'A consignment is small enough that its tonnage fee comes to less than the minimum for its class. According to the text, what does the port charge?',
      options: [
        { id: 'a', text: 'The tonnage fee, since it is the lower of the two.' },
        { id: 'b', text: 'The class minimum, and nothing besides.' },
        { id: 'c', text: 'The class minimum together with the tonnage fee.' },
        { id: 'd', text: 'The class minimum, with the difference returned once the cargo is cleared.' },
      ],
      correctOptionId: 'b',
      reasoning: 'classify-scenario',
      dependsOn: ['p2'],
      supportSpans: [
        { blockId: 'p2', quote: 'Where the tonnage produces a fee below the class minimum, the minimum is charged in its place.' },
        { blockId: 'p2', quote: 'The minimum is never added to the tonnage fee, and a consignment is never charged both.' },
      ],
      explanation:
        'The text settles both halves of this. The minimum replaces the tonnage fee rather than sitting alongside it — it is charged in its place — and the second sentence closes off the other reading in as many words: the two are never charged together.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'wrong-direction-of-effect',
          reason:
            'A minimum that gave way to any smaller figure would never apply to anything. Its purpose is to set a floor, so it takes over precisely when the tonnage fee is lower.',
        },
        c: {
          blockId: 'p2',
          family: 'contradicts-source',
          reason:
            'The text rules this out explicitly, which suggests it is the reading it expects. The minimum stands in place of the fee and is not an addition to it.',
        },
        d: {
          blockId: 'p2',
          family: 'plausible-but-unstated',
          reason:
            'Nothing in the tariff provides for a refund of any kind. The minimum is simply what is charged.',
        },
      },
      hints: [
        { level: 1, text: 'The rule is stated in two sentences, and the second is there to close off a particular misreading.' },
        { level: 2, text: 'Ask what a minimum is for, and what would follow if the smaller figure always won.' },
        { level: 3, text: 'Decide whether the minimum replaces the tonnage fee or joins it.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 1, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },

    {
      stem: 'Which class of cargo carries the highest rate per tonne?',
      options: [
        { id: 'a', text: 'General' },
        { id: 'b', text: 'Bulk grain' },
        { id: 'c', text: 'Refrigerated' },
        { id: 'd', text: 'Hazardous' },
      ],
      correctOptionId: 'd',
      reasoning: 'read-exhibit',
      dependsOn: ['t1'],
      supportSpans: [
        { blockId: 't1', quote: 'Rate per tonne' },
        { blockId: 't1', quote: 'Hazardous' },
      ],
      explanation:
        'The table has two money columns and the question asks about one of them. Reading down the rate column alone, one class stands well above the others; the minimum charges are a separate matter and are not what is being compared.',
      refutations: {
        a: {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'This class sits in the middle of the rate column, above bulk grain and below the two dearer classes.',
        },
        b: {
          blockId: 't1',
          family: 'wrong-direction-of-effect',
          reason:
            'This is the cheapest class per tonne in the table, which suits a cargo that arrives in very large quantities.',
        },
        c: {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'This class is dear per tonne and is not the dearest. One class is charged at a higher rate still.',
        },
      },
      hints: [
        { level: 1, text: 'The table carries two figures for each class; only one of them is asked about.' },
        { level: 2, text: 'The minimum charge and the rate per tonne do not run in the same order.' },
        { level: 3, text: 'Read down the rate column on its own and take the largest figure in it.' },
      ],
      difficulty: 'low',
      meta: { stepCount: 1, blockSpan: 1, transferDistance: 1, requiresExhibit: true },
    },

    {
      stem: 'According to the text, what decides whether a consignment is charged a handling fee at all?',
      options: [
        { id: 'a', text: 'Whether the port handles it, that is whether it leaves the port area.' },
        { id: 'b', text: 'The class the cargo falls in.' },
        { id: 'c', text: 'Whether the port has room to store it once it is landed.' },
        { id: 'd', text: 'Whether its tonnage comes to a whole number.' },
      ],
      correctOptionId: 'a',
      reasoning: 'qualitative-inference',
      dependsOn: ['p4', 'p1'],
      supportSpans: [
        { blockId: 'p4', quote: 'passes between vessels without leaving the port area, is not handled by the port and pays nothing at all' },
        { blockId: 'p4', quote: 'Its class makes no difference to that, and neither does its tonnage.' },
        { blockId: 'p1', quote: 'The port charges a handling fee on cargo it lands.' },
      ],
      explanation:
        'The tariff is a charge for handling, so the question of whether anything is owed comes before any question of how much. Cargo that moves between vessels is never handled and so is outside the tariff altogether. The text closes off the alternatives itself: neither class nor tonnage has any bearing on whether the exemption applies.',
      refutations: {
        b: {
          blockId: 'p4',
          family: 'right-concept-wrong-scope',
          reason:
            'Class decides the rate and the minimum, which is how much is charged. The text says in terms that it makes no difference to whether anything is charged.',
        },
        c: {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'Storage is nowhere in the tariff. The fee is described throughout as a charge for handling the cargo, and nothing is said to turn on what happens to it afterwards.',
        },
        d: {
          blockId: 'p3',
          family: 'plausible-but-unstated',
          reason:
            'A part tonne is rounded up and charged like any other. Nothing in the text makes a whole tonnage a condition of being charged.',
        },
      },
      hints: [
        { level: 1, text: 'Distinguish what decides whether anything is owed from what decides how much.' },
        { level: 2, text: 'One paragraph describes cargo that pays nothing at all; find the condition it turns on.' },
        { level: 3, text: 'That paragraph also says which two things make no difference — use it to clear three of the options.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 2, transferDistance: 2, requiresExhibit: false },
    },
  ],
)

/* ----------------------------------------------------------- SOCIAL SCIENCES */
// The regression case for DOCTRINAL COUPLING. The retired experiment asked four
// questions of the shape "is this sound?", so the pack's posture — learned from
// any one answer — cleared options in all the others. Here the four answers are
// a coder pair, a procedure, a description of what a number measures, and a
// single named condition. No two are verdicts, and no distractor is wrong
// because of a doctrine another answer states.

emit(
  {
    id: 'gam-social-sciences-coding-agreement-001',
    idStem: 'gam-ss-ca-001',
    domain: 'social-sciences',
    title: 'Coding open answers, and checking the coders',
    defines: ['coding frame', 'double-coded', 'agreement rate'],
    blocks: [
      { kind: 'heading', id: 'h1', text: 'Coding open answers, and checking the coders' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'Answers written in a respondent’s own words are turned into categories before they can be counted. The list of categories, with a written rule for what belongs in each, is the coding frame. A share of the answers is double-coded, meaning that two coders work on the same answers without seeing each other’s decisions, and the proportion of those answers they place in the same category is the pair’s agreement rate.',
      },
      {
        kind: 'table',
        id: 't1',
        caption: 'Agreement rates for four pairs of coders, on the same set of double-coded answers.',
        columns: ['Pair', 'Answers double-coded', 'Agreement rate'],
        rows: [
          ['Pair 1', '300', '91 per cent'],
          ['Pair 2', '300', '74 per cent'],
          ['Pair 3', '300', '88 per cent'],
          ['Pair 4', '300', '83 per cent'],
        ],
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'Where an answer could be placed in more than one category, the frame directs the coder to the category named earliest in the list, and to record the answer as contested. Contested answers are counted in the category they were given and are also set aside for the frame to be revised at the end of the round.',
      },
      {
        kind: 'paragraph',
        id: 'p3',
        text:
          'An agreement rate measures whether two coders read the frame the same way. It says nothing about whether the frame captures what the respondents meant: two coders can apply a poorly drawn category with perfect consistency, and their agreement will be as high as if the category were a good one.',
      },
      {
        kind: 'paragraph',
        id: 'p4',
        text:
          'A coder who has seen the other coder’s decisions is no longer coding independently, and the pair’s figure is not an agreement rate at all. The one condition the procedure rests on is that the two work unaware of each other.',
      },
    ],
  },
  [
    {
      stem: 'Which pair placed the fewest of their answers in the same category as one another?',
      options: [
        { id: 'a', text: 'Pair 1' },
        { id: 'b', text: 'Pair 2' },
        { id: 'c', text: 'Pair 3' },
        { id: 'd', text: 'Pair 4' },
      ],
      correctOptionId: 'b',
      reasoning: 'read-exhibit',
      dependsOn: ['t1', 'p1'],
      supportSpans: [
        { blockId: 't1', quote: 'Agreement rate' },
        { blockId: 'p1', quote: 'the proportion of those answers they place in the same category is the pair’s agreement rate' },
      ],
      explanation:
        'Reading the frame differently shows up as disagreement, so the pair wanted is the one with the lowest agreement rate rather than the highest. Every pair coded the same number of answers, so the rates can be set side by side without any adjustment, and one of them sits well below the other three.',
      refutations: {
        a: {
          blockId: 't1',
          family: 'wrong-direction-of-effect',
          reason:
            'This pair agreed more often than any other, so of the four they read the frame most alike. It is the answer to the opposite question.',
        },
        c: {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'This pair is among the closer-agreeing of the four, second only to the highest. Another pair disagreed a great deal more often.',
        },
        d: {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'This pair sits in the middle of the four. Its rate is lower than two of the others and clearly higher than the lowest.',
        },
      },
      hints: [
        { level: 1, text: 'Decide first whether reading the frame differently means a high figure or a low one.' },
        { level: 2, text: 'Every pair coded the same number of answers, so the rates compare directly.' },
        { level: 3, text: 'Look for the smallest figure in the agreement column, not the largest.' },
      ],
      difficulty: 'low',
      meta: { stepCount: 2, blockSpan: 2, transferDistance: 1, requiresExhibit: true },
    },

    {
      stem:
        'A coder finds an answer that fits two of the frame’s categories equally well. According to the frame, what should the coder do?',
      options: [
        { id: 'a', text: 'Leave it uncoded and come back to it once the whole batch has been read.' },
        { id: 'b', text: 'Place it in whichever category holds the fewest answers so far.' },
        { id: 'c', text: 'Use whichever of the two stands earlier in the list, and mark the answer as one in dispute.' },
        { id: 'd', text: 'Place it in both categories, so that neither reading is lost.' },
      ],
      correctOptionId: 'c',
      reasoning: 'classify-scenario',
      dependsOn: ['p2'],
      supportSpans: [
        { blockId: 'p2', quote: 'the frame directs the coder to the category named earliest in the list, and to record the answer as contested' },
      ],
      explanation:
        'The frame gives an arbitrary but definite tie-break — the earlier category — precisely so that two coders meeting the same difficulty resolve it the same way. The second half of the instruction matters as much: marking the answer contested is what lets the difficulty be found again when the frame is revised.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'plausible-but-unstated',
          reason:
            'Deferring the answer is not what the frame asks for. It gives a decision rule to be applied when the difficulty arises, precisely so that the answer does not wait.',
        },
        b: {
          blockId: 'p2',
          family: 'plausible-but-unstated',
          reason:
            'Balancing the categories is a rule the frame does not give, and it would make a coder’s decision depend on the order the answers happened to arrive in.',
        },
        d: {
          blockId: 'p2',
          family: 'contradicts-source',
          reason:
            'The instruction is to place the answer in one category and flag it. Counting it twice would make the categories add to more than the number of answers.',
        },
      },
      hints: [
        { level: 1, text: 'The frame anticipates this difficulty and gives an instruction with two parts.' },
        { level: 2, text: 'The tie-break does not depend on the content of the answer at all.' },
        { level: 3, text: 'Having placed the answer, ask what the coder is told to record about it.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 1, requiresExhibit: false },
    },

    {
      stem: 'According to the text, what does a pair’s agreement rate measure?',
      options: [
        { id: 'a', text: 'Whether the categories capture what the respondents meant.' },
        { id: 'b', text: 'Whether the two coders read the frame the same way.' },
        { id: 'c', text: 'How many answers were difficult enough to be contested.' },
        { id: 'd', text: 'How closely the coded results match the population being described.' },
      ],
      correctOptionId: 'b',
      reasoning: 'retrieve',
      dependsOn: ['p3'],
      supportSpans: [
        { blockId: 'p3', quote: 'An agreement rate measures whether two coders read the frame the same way.' },
        { blockId: 'p3', quote: 'two coders can apply a poorly drawn category with perfect consistency' },
      ],
      explanation:
        'The figure is about the coders and not about the frame. The text presses the distinction with an example: a badly drawn category applied consistently by both coders produces just as high a rate as a well drawn one, so a high figure cannot be read as evidence that the categories are any good.',
      refutations: {
        a: {
          blockId: 'p3',
          family: 'contradicts-source',
          reason:
            'This is the reading the text sets out to block. Consistency between two readers and fidelity to what respondents meant are separate things, and the rate speaks only to the first.',
        },
        c: {
          blockId: 'p2',
          family: 'right-concept-wrong-scope',
          reason:
            'Contested answers are recorded, but they are a separate count. An answer can be contested by both coders and still placed in the same category by both, which counts as agreement.',
        },
        d: {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'Nothing in the text connects the rate to the population. It is computed entirely within the set of double-coded answers.',
        },
      },
      hints: [
        { level: 1, text: 'The text states what the rate measures and then, at more length, what it does not.' },
        { level: 2, text: 'Ask whose behaviour the figure is computed from.' },
        { level: 3, text: 'The example about a poorly drawn category is there to rule one of these options out.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 1, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },

    {
      stem:
        'According to the text, which single condition must hold for a pair’s figure to be an agreement rate at all?',
      options: [
        { id: 'a', text: 'That the two coders worked unaware of each other’s decisions.' },
        { id: 'b', text: 'That the same number of answers was double-coded for every pair.' },
        { id: 'c', text: 'That the frame was left unrevised until the end of the round.' },
        { id: 'd', text: 'That contested answers were excluded before the rate was worked out.' },
      ],
      correctOptionId: 'a',
      reasoning: 'qualitative-inference',
      dependsOn: ['p4'],
      supportSpans: [
        { blockId: 'p4', quote: 'The one condition the procedure rests on is that the two work unaware of each other.' },
        { blockId: 'p4', quote: 'A coder who has seen the other coder’s decisions is no longer coding independently' },
      ],
      explanation:
        'The text singles this out and says why: once one coder has seen the other’s decisions, the second set of codes is no longer arrived at separately, so what looks like agreement may be nothing more than one coder following the first. The figure then measures nothing about how the frame was read.',
      refutations: {
        b: {
          blockId: 't1',
          family: 'right-concept-wrong-scope',
          reason:
            'Equal numbers make the four pairs easy to compare with one another. They are not what makes any one of the figures an agreement rate.',
        },
        c: {
          blockId: 'p2',
          family: 'plausible-but-unstated',
          reason:
            'Revision at the end of the round is what happens to contested answers. The text attaches no condition about revision to the rate itself.',
        },
        d: {
          blockId: 'p2',
          family: 'contradicts-source',
          reason:
            'Contested answers are counted in the category they were given, so they are inside the coded set rather than removed from it.',
        },
      },
      hints: [
        { level: 1, text: 'The text names one condition explicitly and calls it the one the procedure rests on.' },
        { level: 2, text: 'Ask what would go wrong if one coder could see the other’s work.' },
        { level: 3, text: 'Separate what makes the four pairs comparable from what makes any single figure meaningful.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },
  ],
)

/* ------------------------------------------------- COMPUTATIONAL SCIENCES */
// The regression case for NUMERIC RECONSTRUCTION. The retired operation-counts
// pack died because every numeric option was a function of one small table, and
// seven option lists recovered the table. Here the table is read by exactly one
// question whose options are NAMES, and the only worked question takes its whole
// case from its own stem. There is no numeric surface for a sibling to expose.

emit(
  {
    id: 'gam-computational-sciences-cache-policy-001',
    idStem: 'gam-cs-cp-001',
    provenanceExtra: {
      retiredQuestions: [
        {
          id: 'gam-cs-cp-001-q2',
          retiredOn: '2026-09-09',
          reason:
            'Withdrawn for decisive sibling coupling, not for incorrectness. The question asked what the system does on a miss. q1’s stem states as a given fact that on a request for a record not in the cache one record "is dropped to make room" for it — which is q2’s correct option almost word for word, and is incompatible with its other three. The adjudicator of 9 September 2026 (Claude Opus 5, blind to the key) called the coupling total: a candidate who reads q1 first can answer q2 without the source at all. Three earlier rewrites of this slot each closed one channel and opened another, so the slot is withdrawn rather than patched a fourth time. The id is reserved and never reused; the pack keeps the three questions that were clean.',
        },
      ],
    },
    domain: 'computational-sciences',
    title: 'A cache and its replacement policy',
    defines: ['cache', 'hit rate', 'replacement policy'],
    blocks: [
      { kind: 'heading', id: 'h1', text: 'A cache and its replacement policy' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'A cache keeps a small number of records close at hand so that they need not be fetched from the slow store each time. When a record is asked for and is already in the cache the request is a hit; otherwise it is a miss, the record is fetched and placed in the cache, and if the cache is full one record must be dropped to make room. The share of requests that are hits is the cache’s hit rate.',
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'This system drops whichever record has gone longest without being asked for. A hit counts as an asking, so a record that is found in the cache is thereby moved to the back of the queue for eviction; a record that is merely written back to the slow store is not, because writing is not a request for the record.',
      },
      {
        kind: 'table',
        id: 't1',
        caption: 'Four caches on one machine, as measured over a working day.',
        columns: ['Cache', 'Records held', 'Hit rate'],
        rows: [
          ['Index cache', '64', '97 per cent'],
          ['Document cache', '512', '61 per cent'],
          ['Thumbnail cache', '2048', '88 per cent'],
          ['Session cache', '128', '79 per cent'],
        ],
      },
      {
        kind: 'paragraph',
        id: 'p3',
        text:
          'A hit rate is a property of the pairing of a cache with the pattern of requests it happens to meet. The figures above were measured on one working day’s traffic; a different pattern of requests would give different figures on the same caches, and they are not a ranking of the caches in themselves.',
      },
    ],
  },
  [
    {
      qid: 'q1',
      stem:
        'A cache holds three records. It currently holds P, Q and R, which were last asked for in that order, P longest ago. A request arrives for P, and then a request arrives for S. According to the policy, which record is dropped to make room for S?',
      options: [
        { id: 'a', text: 'P' },
        { id: 'b', text: 'Q' },
        { id: 'c', text: 'R' },
        { id: 'd', text: 'S is added without dropping anything, since the request for P was a hit.' },
      ],
      correctOptionId: 'b',
      reasoning: 'apply-formula',
      dependsOn: ['p2', 'p1'],
      supportSpans: [
        { blockId: 'p2', quote: 'This system drops whichever record has gone longest without being asked for.' },
        { blockId: 'p2', quote: 'A hit counts as an asking, so a record that is found in the cache is thereby moved to the back of the queue for eviction' },
      ],
      explanation:
        'P was the record that had waited longest, so it is the one an eviction would have taken. The request for P is a hit, and the text is explicit that a hit counts as an asking: P is thereby moved to the back of the queue and becomes the most recently used of the three. That leaves Q and R, and Q was asked for before R. So when S arrives and the cache is full, it is Q that has now gone longest without being asked for.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'right-concept-wrong-scope',
          reason:
            'P had indeed waited longest, and it is the answer only if the request for it is ignored. The text says a hit counts as an asking, and that request is a hit, so P has just become the most recently used record of the three.',
        },
        c: {
          blockId: 'p2',
          family: 'arithmetic-slip',
          reason:
            'R was asked for more recently than Q, and the hit on P does not change how those two stand relative to one another. Dropping R would evict the newer of the pair still waiting.',
        },
        d: {
          blockId: 'p1',
          family: 'contradicts-source',
          reason:
            'A hit frees no space: the record was already in the cache and still is. S is not in the cache, so it is a miss, and the text says a miss on a full cache requires a record to be dropped.',
        },
      },
      hints: [
        { level: 1, text: 'Settle what the first of the two requests does to the order before considering the second at all.' },
        { level: 2, text: 'The text says whether being found in the cache counts as being asked for; that sentence is the whole of this question.' },
        { level: 3, text: 'The record that had waited longest has just been asked for, so ask which one has waited longest now.' },
      ],
      difficulty: 'high',
      meta: { stepCount: 3, blockSpan: 2, transferDistance: 2, requiresExhibit: false },
    },

    {
      qid: 'q3',
      stem: 'Which cache met the smallest share of its requests without going to the slow store?',
      options: [
        { id: 'a', text: 'The index cache' },
        { id: 'b', text: 'The document cache' },
        { id: 'c', text: 'The thumbnail cache' },
        { id: 'd', text: 'The session cache' },
      ],
      correctOptionId: 'b',
      reasoning: 'read-exhibit',
      dependsOn: ['t1', 'p1'],
      supportSpans: [
        { blockId: 'p1', quote: 'The share of requests that are hits is the cache’s hit rate.' },
        { blockId: 't1', quote: 'Hit rate' },
      ],
      explanation:
        'A request met without going to the slow store is a hit, so the question asks for the lowest hit rate. The table also gives how many records each cache holds, and that column plays no part here: a cache can be large and still meet few of its requests, which is what the figures show.',
      refutations: {
        a: {
          blockId: 't1',
          family: 'wrong-direction-of-effect',
          reason:
            'This cache has the highest hit rate of the four and holds the fewest records. It is the answer to the opposite question.',
        },
        c: {
          blockId: 't1',
          family: 'swapped-quantities',
          reason:
            'This cache holds far more records than any other, which makes it tempting if the size column is read instead of the hit rate. Its hit rate is among the higher ones.',
        },
        d: {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'This cache sits in the middle of the hit-rate column. Another cache met a distinctly smaller share of its requests.',
        },
      },
      hints: [
        { level: 1, text: 'Translate the question into the table’s own vocabulary before reading anything.' },
        { level: 2, text: 'A request met without going to the slow store has a name in the first paragraph.' },
        { level: 3, text: 'One of the table’s two number columns is irrelevant here; decide which.' },
      ],
      difficulty: 'low',
      meta: { stepCount: 2, blockSpan: 2, transferDistance: 1, requiresExhibit: true },
    },

    {
      qid: 'q4',
      stem:
        'An engineer proposes using the table to decide which of the four designs is the better cache. According to the text, what is wrong with that?',
      options: [
        { id: 'a', text: 'Nothing, provided the caches are compared over an equal number of requests.' },
        { id: 'b', text: 'The figures depend on the requests each cache happened to meet, so they do not rank the caches themselves.' },
        { id: 'c', text: 'The figures cannot be compared because the caches hold different numbers of records.' },
        { id: 'd', text: 'A hit rate measured over a single day is too short a period to be used at all.' },
      ],
      correctOptionId: 'b',
      reasoning: 'qualitative-inference',
      dependsOn: ['p3'],
      supportSpans: [
        { blockId: 'p3', quote: 'A hit rate is a property of the pairing of a cache with the pattern of requests it happens to meet.' },
        { blockId: 'p3', quote: 'they are not a ranking of the caches in themselves' },
      ],
      explanation:
        'The text locates a hit rate in a pairing rather than in a cache. Each of the four met a different stream of requests over the day — one serving an index, another documents — so the figures describe four different situations, and the differences between them are as much about the traffic as about the designs.',
      refutations: {
        a: {
          blockId: 'p3',
          family: 'plausible-but-unstated',
          reason:
            'Equal numbers of requests would not help, because the objection is about what the requests were rather than how many there were.',
        },
        c: {
          blockId: 'p3',
          family: 'right-concept-wrong-scope',
          reason:
            'Differing sizes are a real difference between the four and are not the objection the text raises. It puts the difficulty in the request patterns.',
        },
        d: {
          blockId: 'p3',
          family: 'plausible-but-unstated',
          reason:
            'The text records the measurement period without calling it too short, and says the figures would differ under a different pattern rather than a longer one.',
        },
      },
      hints: [
        { level: 1, text: 'The last paragraph says what kind of thing a hit rate is a property of.' },
        { level: 2, text: 'Ask whether the four caches were meeting the same work as one another.' },
        { level: 3, text: 'Three options name real differences between the caches; only one names the one the text objects on.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },
  ],
)
