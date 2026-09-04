/**
 * Sixth pass, 4 September 2026 — the two concrete findings of the §5.10 round.
 *
 *   AMBIGUITY  gam-cs-oc-001-q7. p3 said the counts "are multiplied" when one
 *   routine runs once per record of another, without saying multiplied by what.
 *   Paragraph 1 defines a routine's count as T(n), which invites multiplying
 *   T_SCAN by T_SPLIT — exactly option c. Both readings were defensible from the
 *   text as written, which makes it a defect in the source rather than in the
 *   question. p3 now says which factor is meant, and option c becomes the clean
 *   distractor it was always intended to be.
 *
 *   LEAK  gam-eng-tr-001-q5 was given away by q6, whose stem said the wall "is
 *   to be brought within the guidance" — presupposing that it currently fails,
 *   which is precisely what q5 asks. The stem no longer presupposes it.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const dir = new URL('../../../content/gam/packs/', import.meta.url)

function edit(fileName, mutate) {
  const url = new URL(fileName, dir)
  const file = JSON.parse(readFileSync(url, 'utf8'))
  mutate(file)
  file.pack.contentHash = contentHash(file)
  writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
  console.log(`${fileName} · hash ${file.pack.contentHash}`)
}

edit('gam-computational-sciences-operation-counts-001.json', (file) => {
  const p3 = file.pack.blocks.find((b) => b.id === 'p3')
  p3.text =
    'When two routines run one after the other on the same catalogue, their operation counts are added. ' +
    'When one routine is run once for every record that another routine processes, the inner routine’s ' +
    'count is multiplied by the number of records processed, and not by the outer routine’s own count.'

  const q7 = file.questions.find((q) => q.id === 'gam-cs-oc-001-q7')
  q7.supportSpans = [
    {
      blockId: 'p3',
      quote:
        'the inner routine’s count is multiplied by the number of records processed, and not by the outer routine’s own count',
    },
    { blockId: 't1', quote: 'SPLIT 140 240 340' },
  ]
  q7.refutations.c.reason =
    '5,580,760 multiplies the two routines’ counts together, which is the reading the text rules out. What ' +
    'multiplies SPLIT’s count is the number of records processed, not the number of steps SCAN takes to ' +
    'process them.'
})

edit('gam-engineering-thermal-resistance-001.json', (file) => {
  const q6 = file.questions.find((q) => q.id === 'gam-eng-tr-001-q6')
  q6.stem =
    'Which of the following changes would leave the wall in Figure 2 with a U-value no greater than the ' +
    'guidance allows?'
})
