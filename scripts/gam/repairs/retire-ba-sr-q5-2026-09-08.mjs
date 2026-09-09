/**
 * Retire gam-ba-sr-001-q5, 8 September 2026.
 *
 * Not because it is wrong. Two independent rounds agreed with its key. It is
 * retired because it does no work.
 *
 *   - Both ablation adjudicators answered it correctly with no source at all —
 *     Claude Sonnet 5 on 7 September, Claude Opus 5 on 8 September, the latter at
 *     high confidence. A buyer choosing between one calendar year and two, under
 *     a rebate that rises with volume, is ordinary commercial reasoning.
 *   - The Opus round rated it DECISIVELY leaked: q2 demonstrates numerically that
 *     twenty units inside one calendar year move the year's rebate by roughly
 *     1,600 euros, which kills q5's "the rebate turns on how many units are
 *     bought, not on when" outright, and q1's option list shows the per-unit rate
 *     rising with the year's total, which is the whole of q5's argument.
 *
 * A question that a candidate can answer without the pack AND read off its
 * siblings discriminates nothing. Rewriting it as a computation was considered
 * and rejected: every numeric option in this pack is a unit count times a band
 * rate, and the unit counts are in the stems, so another numeric item would hand
 * the adjudicator one more point on the rate ladder — which is the pack-level
 * fault the Opus round identified. Fewer questions on this source is the repair;
 * a cleverer fifth question is not.
 *
 * The id is retired, not reused. Nothing renumbers.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const url = new URL(
  '../../../content/gam/packs/gam-business-administration-step-rebate-001.json',
  import.meta.url,
)
const file = JSON.parse(readFileSync(url, 'utf8'))
const RETIRED = 'gam-ba-sr-001-q5'

const gone = file.questions.find((q) => q.id === RETIRED)
if (gone) {
  file.questions = file.questions.filter((q) => q.id !== RETIRED)
  const p = file.pack.provenance
  p.retiredQuestions = [
    ...(p.retiredQuestions ?? []).filter((r) => r.id !== RETIRED),
    {
      id: RETIRED,
      retiredOn: '2026-09-08',
      stem: gone.stem,
      correctOptionId: gone.correctOptionId,
      reason:
        'Retired as non-discriminating, not as incorrect. Two independent adjudication rounds agreed with ' +
        'its key. Both ablation halves answered it with no source at all — Claude Sonnet 5 on 7 September, ' +
        'Claude Opus 5 on 8 September at high confidence — and the Opus round rated it decisively leaked by ' +
        'q1 and q2: q2 shows numerically that twenty units inside one calendar year move the rebate by ' +
        'roughly 1,600 euros, which eliminates the "timing does not matter" option outright, and q1 shows ' +
        'the per-unit rate rising with the year’s total, which is the rest of the argument. An item ' +
        'answerable without the pack and readable off its siblings adds nothing. Reworking it as a ' +
        'computation was rejected: every numeric option in this pack is a unit count times a band rate, so ' +
        'a further numeric item would expose one more point on the rate ladder the Opus round showed is ' +
        'already recoverable across siblings. The id is reserved and never reused.',
    },
  ]
  file.pack.contentHash = contentHash(file)
  writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
}
console.log(
  `step-rebate: ${gone ? 'retired ' + RETIRED : RETIRED + ' already retired'} · ` +
    `${file.questions.length} questions · hash ${file.pack.contentHash}`,
)
