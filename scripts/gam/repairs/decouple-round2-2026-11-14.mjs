/**
 * Second coupling pass, 14 November 2026 — acting on what the re-ablation found
 * about the first one.
 *
 * The 14 November edits were re-tested blind, source withheld, by an adjudicator
 * that had not seen the keys. Seven of nineteen questions still leaked. The
 * numeric couplings are gone for good — every pack now carries at most one
 * numeric item, and two carry none, so cross-question arithmetic reconstruction
 * is structurally impossible. What survived is conceptual, and two of my own
 * edits were part of the problem rather than the fix. Recorded plainly:
 *
 * ECONOMICS q4 — MY EDIT LEFT A DEFECT STANDING. I replaced option b and kept
 *   option d, "whether its tonnage comes to a whole number". q1's stem charges a
 *   handling fee on 120.4 tonnes without hesitation and offers no zero-fee
 *   option, so q1 falsifies d outright, with no key needed. Keeping a tonnage
 *   distractor was right — p4 says in terms that tonnage makes no difference —
 *   but it had to be one q1 does not contradict. It now reads "whether its
 *   tonnage reaches the lowest figure the tariff lists": still refuted by p4,
 *   no longer refuted by a sibling's stem.
 *
 *   The blind re-answer also found the KEY's own wording confusing: "whether it
 *   leaves the port area" sits next to p4's definition of transhipment as
 *   passing between vessels *without* leaving, so the gloss reads as though it
 *   describes the exempt case. The option now says "landed rather than passed
 *   straight between vessels", which is p1 and p4 in their own terms. This
 *   changes no answer; it removes a stumble over which option a is correct.
 *
 * NATURAL SCIENCES q1 — RETIRED, AND MY EDIT MADE IT WORSE. q2's answer fixes
 *   the thermocline as a sharp temperature band and q3's stem asserts winter
 *   uniformity, so a candidate with neither figure nor text knows the summer
 *   profile falls with depth. Every option is then ordered by depth and the item
 *   collapses to "pick the deepest". My edit replaced "none of the depths shown"
 *   with "at the surface" — which removed the one option that was not a depth on
 *   that ladder and so tightened the collapse instead of breaking it. The
 *   adjudicator rated it decisive.
 *
 *   The repair it needs is not an option swap. It needs a profile that is not
 *   monotone in depth, so that "deepest" stops being a winning guess — and that
 *   is a different figure, which is a new source and a new item, not an edit to
 *   this one. Retired rather than rewritten under time pressure.
 *
 * SOCIAL SCIENCES q3 — RETIRED AS THE IRREDUCIBLE HALF OF A PAIR. q3 asks what
 *   an agreement rate measures; q4 asks what follows when independence is
 *   broken. These are one proposition asked forwards and backwards: granting
 *   q4's answer eliminates three of q3's four options, and granting q3's forces
 *   q4's. The adjudicator named it as the case no rewording separates, and it is
 *   right. q4 survives because it applies the rule to a case; q3 goes because
 *   its answer is a definition, which is the weaker of the two to keep.
 *
 * Active GAM questions: 19 → 17. Nothing is renumbered and no id is reused.
 * Two fewer sound questions is the honest outcome; a cleverer replacement
 * authored against a deadline is not.
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { contentHash } from '../lib/validate.mjs'

const PACKS = new URL('../../../content/gam/packs/', import.meta.url)
const open = (id) => {
  const url = new URL(`${id}.json`, PACKS)
  return { url, file: JSON.parse(readFileSync(url, 'utf8')) }
}
const save = ({ url, file }) => {
  file.pack.contentHash = contentHash(file)
  writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
}

/* ------------------------------------------------- economics: option repair */

{
  const ctx = open('gam-economics-port-tariff-001')
  const q = ctx.file.questions.find((x) => x.id === 'gam-econ-pt-001-q4')

  q.options.find((o) => o.id === 'a').text =
    'Whether the port handles it, that is whether the cargo is landed rather than passed straight between vessels.'

  q.options.find((o) => o.id === 'd').text =
    'Whether its tonnage reaches the lowest figure the tariff lists.'
  q.refutations.d = {
    blockId: 'p4',
    family: 'plausible-but-unstated',
    reason:
      'The tariff lists no tonnage floor — every class carries a rate and a minimum charge, not a minimum weight — and p4 says in terms that tonnage makes no difference to whether anything is charged.',
  }

  q.explanation =
    'The tariff is a charge for handling, so whether anything is owed comes before any question of how much. Cargo that passes between vessels without going ashore is never handled, and so sits outside the tariff altogether. The text names that condition exactly, and says in terms that tonnage makes no difference to it; each of the other options attaches a condition the text never attaches.'
  save(ctx)
  console.log('economics: q4 options a and d repaired')
}

/* --------------------------------------------------------- two retirements */

const retire = (packId, questionId, reason) => {
  const ctx = open(packId)
  const gone = ctx.file.questions.find((q) => q.id === questionId)
  if (!gone) {
    console.log(`${questionId} already absent`)
    return
  }
  ctx.file.questions = ctx.file.questions.filter((q) => q.id !== questionId)
  const p = ctx.file.pack.provenance
  p.retiredQuestions = [
    ...(p.retiredQuestions ?? []).filter((r) => r.id !== questionId),
    { id: questionId, retiredOn: '2026-11-14', reason, question: gone },
  ]
  save(ctx)
  console.log(`${packId}: retired ${questionId} (${ctx.file.questions.length} remain)`)
}

retire(
  'gam-natural-sciences-lake-oxygen-001',
  'gam-ns-lox-001-q1',
  'Decisively coupled to its siblings. q2 fixes the thermocline as a sharp temperature band and q3’s stem asserts winter uniformity, so the summer profile’s downward shape is available without the figure or the text. Every option is a depth, so the item reduces to choosing the deepest. The 14 November edit replaced "none of the depths shown" with "at the surface" and made this worse, not better: it removed the only option outside the depth ordering. No key is wrong — the independent re-answer agreed with it at high confidence — and there is no ambiguity finding against it. The repair needed is a profile that is not monotone in depth, so that "deepest" stops being a winning guess, and that is a new figure and a new item rather than an edit to this one. Retired rather than rewritten against a deadline. Id reserved, never reused.',
)

retire(
  'gam-social-sciences-coding-agreement-001',
  'gam-ss-ca-001-q3',
  'The irreducible half of a mutually decisive pair. q3 asks what an agreement rate measures; q4 asks what follows once independence is broken. Granting q4’s answer — that the figure is not an agreement rate at all once a coder has seen the other’s decisions — eliminates three of q3’s four options, because only "whether the two coders read the frame the same way" is a property independence underwrites. Granting q3’s answer forces q4’s in turn. This is one proposition asked forwards and backwards, and no rewording of either separates them. q4 is kept because it applies the rule to a case the source does not work through; q3 goes because its answer is a restatement of a definition, which is the weaker of the two to keep. No key is wrong and there is no ambiguity finding against it. Id reserved, never reused.',
)
