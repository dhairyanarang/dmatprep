import type { Claim } from '@/lib/types/content'

/**
 * The audit record for the exam reference pages.
 *
 * These pages are bespoke visual layouts rather than generic block lists, so
 * their facts live in the page components. This file is the flat, auditable
 * registry of those facts and the official documents behind them, and it is
 * what `/exam/sources` is built from.
 *
 * It deliberately holds claims, not renderable content: keeping a second prose
 * copy of each page in the content layer would drift the moment either changed.
 * When a fact on one of those pages changes, change it here too.
 */
export type PageClaims = {
  where: string
  href: string
  claims: Claim[]
}

const GAM = 'gam-pdf' as const
const TERMS = 'dmat-terms' as const
const HOME = 'dmat-home' as const
const INDIA = 'dmat-india' as const
const APS = 'aps-dmat' as const
const FIELDS = 'aps-fields' as const

export const EXAM_CLAIMS: PageClaims[] = [
  {
    where: 'Format & Structure',
    href: '/exam',
    claims: [
      { text: 'The dMAT consists of two modules: a Core Module and a Subject Module.', sources: [{ id: 'dmat-structure' }] },
      { text: 'Each Core Module subtest runs 25 minutes for 20 items — 75 minutes and 60 items in total.', sources: [{ id: GAM, page: 8 }, { id: GAM, page: 18 }, { id: GAM, page: 25 }] },
      { text: 'The Subject Module runs 90 minutes, with four answer options per question and exactly one correct.', sources: [{ id: GAM, page: 34 }] },
      { text: 'Subject Module topics span mathematics, computational sciences, natural sciences, engineering, business administration, economics, social sciences and humanities.', sources: [{ id: GAM, page: 34 }] },
      { text: 'There is a 30-minute break between the two modules; the published parts total 195 minutes.', sources: [{ id: GAM, page: 6 }] },
      {
        text: 'The two official sources disagree on total duration: the preparatory materials say “about three hours with a break of 30 minutes”, d-mat.de says “three and a half hours”.',
        sources: [{ id: GAM, page: 6 }, { id: HOME }],
      },
      { text: 'Every task is single-choice.', sources: [{ id: HOME }] },
      { text: 'Detailed task instructions exist only in the preparatory materials; the exam shows short reminders.', sources: [{ id: GAM, page: 4 }] },
      { text: 'A Figure Sequences item asks for two matrices, so it takes two selections.', sources: [{ id: GAM, page: 7 }] },
    ],
  },
  {
    where: 'Exam-Day Rules',
    href: '/exam/rules',
    claims: [
      { text: 'A valid ID card or passport matching the registration is required; without it you are not admitted.', sources: [{ id: TERMS }] },
      { text: 'Arriving after exam materials are distributed means you are not admitted.', sources: [{ id: TERMS }] },
      { text: 'Mobile phones, tablets, mp3 players, wristwatches including smartwatches, fitness watches, calculators and other electronic devices are prohibited.', sources: [{ id: TERMS }] },
      { text: 'Only the identity document is allowed on the desk.', sources: [{ id: TERMS }] },
      { text: 'A phone ringing during the examination results in exclusion.', sources: [{ id: TERMS }] },
      { text: 'No notes may be taken throughout the exam, and notice paper counts as a prohibited aid.', sources: [{ id: GAM, page: 6 }, { id: TERMS }] },
      { text: 'You may not leave the building for the duration, nor the room until the module ends.', sources: [{ id: TERMS }] },
      { text: 'Lavatories may be used only during designated breaks; cafeteria visits are not permitted during them.', sources: [{ id: TERMS }] },
      { text: 'Consulting notes or reference books during breaks is a violation.', sources: [{ id: TERMS }] },
      { text: 'Exclusion carries no refund, and the Examination Board may deny admission to future sittings.', sources: [{ id: TERMS }] },
      { text: 'Recording, discussing or publishing exam content is prohibited and prosecutable.', sources: [{ id: TERMS }] },
    ],
  },
  {
    where: 'Scoring & Results',
    href: '/exam/scoring',
    claims: [
      { text: 'The dMAT score converts the total number of correct answers to a value between 0 and 200, with a mean of 100.', sources: [{ id: HOME }] },
      { text: 'You also receive a percentile rank, and the total combines both modules.', sources: [{ id: HOME }] },
      { text: 'The official instructions tell candidates to guess when they do not know an answer.', sources: [{ id: GAM, page: 8 }, { id: GAM, page: 25 }, { id: GAM, page: 34 }] },
      {
        text: 'There is no penalty for a wrong answer, so a blank costs exactly what a wrong guess costs.',
        confidence: 'unconfirmed',
        note: 'No official source states this either way. It follows from the score being a conversion of the number of correct answers, and from g.a.s.t. instructing candidates to guess — but “no negative marking” is nowhere written down.',
        sources: [{ id: HOME }, { id: GAM, page: 8 }],
      },
      { text: 'Certificates for the 26 September 2026 sitting are available from 12 October 2026.', sources: [{ id: INDIA }, { id: APS }] },
      { text: 'Results are accessible only through the participant portal; none are sent by phone or email.', sources: [{ id: TERMS }] },
      { text: 'The dMAT certificate is valid indefinitely.', sources: [{ id: TERMS }, { id: HOME }] },
      { text: 'A technical fault caused by g.a.s.t. entitles you to retake at one of the next exam dates.', sources: [{ id: TERMS }] },
      { text: 'The dMAT does not replace document verification, establish formal eligibility, replace anabin, or override recognition requirements.', sources: [{ id: APS }] },
    ],
  },
  {
    where: 'Dates & Logistics',
    href: '/exam/logistics',
    claims: [
      { text: 'Registration opened 29 June 2026 and closes 15 September 2026.', sources: [{ id: INDIA }, { id: APS }] },
      { text: 'The exam is on 26 September 2026 — the first ever sitting.', sources: [{ id: INDIA }, { id: APS }] },
      { text: 'The fee is €150.00, paid to g.a.s.t. on registration rather than to APS India.', sources: [{ id: APS }] },
      { text: 'Payment is electronic; paying at the test centre is allowed only in exceptional cases.', sources: [{ id: TERMS }] },
      { text: 'The contract may be revoked within 14 days; deregistering before the deadline is refunded minus up to 15%.', sources: [{ id: TERMS }] },
      { text: 'There is no refund after the deadline, for non-attendance, or for discontinuing the exam.', sources: [{ id: TERMS }] },
      { text: 'There are ten test centres in India plus Kathmandu in Nepal.', sources: [{ id: INDIA }, { id: APS }] },
      { text: 'Registration is handled through the g.a.s.t. participant portal at gast.de.', sources: [{ id: INDIA }] },
      { text: 'The requirement applies to Master’s applicants in Engineering; Commerce, Accounting, Finance or Economics; and Business or Management, targeting summer semester 2027 or later.', sources: [{ id: APS }, { id: FIELDS }] },
      { text: 'The affected-fields list is guidance and not exhaustive; the official degree title decides.', sources: [{ id: FIELDS }] },
      { text: 'Exemptions cover pre-29 June 2026 APS registrations and shipments, existing APS certificate holders, Bachelor’s and PhD applicants, and confirmed exchange or partnership programmes.', sources: [{ id: APS }] },
      { text: 'The dMAT result is reflected on the APS certificate as an additional element of the documentation.', sources: [{ id: APS }, { id: INDIA }] },
    ],
  },
]
