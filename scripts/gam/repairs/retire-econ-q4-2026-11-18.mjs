/**
 * Retire gam-econ-pt-001-q4, 18 November 2026.
 *
 * Not because the key is wrong. Two independent blind rounds agreed with it,
 * the most recent at high confidence with exactly one defensible option. It is
 * retired because it cannot be fixed by editing it.
 *
 * The 14 November round rated it DECISIVELY leaked, and the leak has two legs
 * that compose:
 *
 *   1. q2's stem stipulates a consignment "small enough that its tonnage fee
 *      comes to less than the minimum for its class" and then asks what the
 *      port charges — and every one of q2's four options names a charge. So the
 *      pack asserts, as given fact, that a consignment below the tariff's
 *      lowest figure is still charged. That makes q4's option d false by
 *      sibling fiat, with no reference to the source.
 *
 *   2. q1's stem spends a clause establishing that the cargo "is landed" while
 *      assuming a handling fee is owed. Option a is the only option naming
 *      landing, and after the 14 November rewording its gloss repeats q1's own
 *      verb. That rewording was mine and it made this leg worse, not better.
 *
 * Two repair passes have now been spent on this item and the second moved it in
 * the wrong direction. A third against a deadline is how a question gets worse
 * while the record says it got better.
 *
 * Fixing it properly is not an edit to this item. It requires redesigning q4
 * and q1 together — q1 must stop establishing the fee trigger in its stem,
 * which means a different stem, and q4 needs options b and c given real textual
 * footing so that eliminating them requires the source rather than ordinary
 * plausibility. That is two new questions and a changed relationship to the
 * source, which belongs in the re-authoring proposal rather than in a repair.
 *
 * The pack keeps q1, q2 and q3. The id is reserved and never reused.
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { contentHash } from '../lib/validate.mjs'

const url = new URL('../../../content/gam/packs/gam-economics-port-tariff-001.json', import.meta.url)
const file = JSON.parse(readFileSync(url, 'utf8'))
const RETIRED = 'gam-econ-pt-001-q4'

const gone = file.questions.find((q) => q.id === RETIRED)
if (!gone) {
  console.log(`${RETIRED} is already absent`)
} else {
  file.questions = file.questions.filter((q) => q.id !== RETIRED)
  const p = file.pack.provenance
  p.retiredQuestions = [
    ...(p.retiredQuestions ?? []).filter((r) => r.id !== RETIRED),
    {
      id: RETIRED,
      retiredOn: '2026-11-18',
      reason:
        'Decisively leaked, and not repairable by editing this item. Two mechanisms compose: q2’s stem stipulates that a consignment below the class minimum is still charged, which falsifies option d by sibling fiat with no reference to the source; and q1’s stem establishes that the cargo “is landed” while assuming a fee is owed, which lexically underwrites option a — the key. The 14 November rewording of option a’s gloss imported q1’s own verb into the key and made that leg worse. No key is wrong: two independent blind rounds agreed with it, the second at high confidence with exactly one defensible option, and there is no ambiguity or outside-knowledge finding against it. The fault is the pack-level relationship between q1, q2 and q4, which an edit to q4 alone cannot reach. A rebuild requires redesigning q1 and q4 together and giving q4’s options b and c real textual footing. Id reserved, never reused.',
      question: gone,
    },
  ]
  file.pack.contentHash = contentHash(file)
  writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
  console.log(`retired ${RETIRED} — ${file.questions.length} questions remain in the pack`)
}
