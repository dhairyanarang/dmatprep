import type { SectionId } from '@/lib/sections'

export type Milestone = {
  /** Stable — it is the localStorage key for the checkbox. Never renumber. */
  id: string
  label: string
  sectionId?: SectionId
  /** Marks the things that have a real-world deadline attached. */
  critical?: boolean
}

export type StudyWeek = {
  id: string
  weekNumber: number
  startDate: string
  endDate: string
  focus: string
  summary: string
  milestones: Milestone[]
}

/**
 * Seven weeks from Monday 10 August 2026 to exam day, Saturday 26 September.
 *
 * The shape is deliberate: learn all three formats first so nothing is a
 * surprise, then one section per week to build accuracy, then mixed practice
 * to build switching speed, then taper. Registration sits in week one because
 * it is the one task that cannot be recovered if missed.
 */
export const STUDY_PLAN: StudyWeek[] = [
  {
    id: 'week-1',
    weekNumber: 1,
    startDate: '2026-08-10',
    endDate: '2026-08-16',
    focus: 'Register, and learn all three formats',
    summary:
      'Get the admin done first, then read every section overview end to end. The goal this week is that no task type is unfamiliar — not that you are fast at any of them.',
    milestones: [
      { id: 'w1-register', label: 'Register for the exam through g.a.s.t. and pay the €150 fee', critical: true },
      { id: 'w1-rules', label: 'Read the exam-day rules, especially what you may not bring' },
      { id: 'w1-guide-fs', label: 'Read the Figure Sequences overview end to end', sectionId: 'figure-sequences' },
      { id: 'w1-guide-me', label: 'Read the Mathematical Equations overview end to end', sectionId: 'mathematical-equations' },
      { id: 'w1-guide-ls', label: 'Read the Latin Squares overview end to end', sectionId: 'latin-squares' },
      { id: 'w1-sample', label: 'Attempt five low-difficulty items in each section, untimed' },
    ],
  },
  {
    id: 'week-2',
    weekNumber: 2,
    startDate: '2026-08-17',
    endDate: '2026-08-23',
    focus: 'Latin Squares',
    summary:
      'A highly rule-based subtest, making it well suited to systematic practice. Get the elimination routine automatic and learn to recognise early whether an item is direct or needs a chain.',
    milestones: [
      { id: 'w2-tips', label: 'Re-read the Latin Squares strategy and mistakes', sectionId: 'latin-squares' },
      { id: 'w2-low', label: 'Clear all low-difficulty Latin Squares items', sectionId: 'latin-squares' },
      { id: 'w2-medium', label: 'Clear all medium-difficulty Latin Squares items', sectionId: 'latin-squares' },
      { id: 'w2-nopaper', label: 'Practise without notes or external working, because notes are not permitted during the exam' },
    ],
  },
  {
    id: 'week-3',
    weekNumber: 3,
    startDate: '2026-08-24',
    endDate: '2026-08-30',
    focus: 'Mathematical Equations',
    summary:
      'Solve equation systems efficiently under time pressure. Build the habit of scanning for a simple starting relationship, and practise both direct solving and checking answer options so you can choose the faster reliable method.',
    milestones: [
      { id: 'w3-tips', label: 'Re-read the Mathematical Equations strategy and mistakes', sectionId: 'mathematical-equations' },
      { id: 'w3-low', label: 'Clear all low-difficulty Mathematical Equations items', sectionId: 'mathematical-equations' },
      { id: 'w3-medium', label: 'Clear all medium-difficulty Mathematical Equations items', sectionId: 'mathematical-equations' },
      { id: 'w3-backsolve', label: 'Practise back-solving: answer ten items by testing options only' },
      { id: 'w3-ls-upkeep', label: 'Keep Latin Squares warm: ten high-difficulty items', sectionId: 'latin-squares' },
    ],
  },
  {
    id: 'week-4',
    weekNumber: 4,
    startDate: '2026-08-31',
    endDate: '2026-09-06',
    focus: 'Figure Sequences',
    summary:
      'The subtest with several interacting visual rules, so it gets a full week. Pay particular attention to movement, rotation, colour and boundary behaviour, and practise identifying which rule is changing between matrices.',
    milestones: [
      { id: 'w4-tips', label: 'Re-read the Figure Sequences strategy and mistakes', sectionId: 'figure-sequences' },
      { id: 'w4-low', label: 'Clear all low-difficulty Figure Sequences items', sectionId: 'figure-sequences' },
      { id: 'w4-medium', label: 'Clear all medium-difficulty Figure Sequences items', sectionId: 'figure-sequences' },
      { id: 'w4-bounce', label: 'Be able to recognise boundary behaviour and identify x + 1 patterns' },
      { id: 'w4-upkeep', label: 'Keep the other two sections warm: ten items each' },
    ],
  },
  {
    id: 'week-5',
    weekNumber: 5,
    startDate: '2026-09-07',
    endDate: '2026-09-13',
    focus: 'High difficulty, all three',
    summary:
      'Use this week to practise the more challenging items in each section. Focus on accurate reasoning first, then gradually reduce the time you need.',
    milestones: [
      { id: 'w5-fs-high', label: 'Clear all high-difficulty Figure Sequences items', sectionId: 'figure-sequences' },
      { id: 'w5-me-high', label: 'Clear all high-difficulty Mathematical Equations items', sectionId: 'mathematical-equations' },
      { id: 'w5-ls-high', label: 'Clear all high-difficulty Latin Squares items', sectionId: 'latin-squares' },
      { id: 'w5-review', label: 'Review every item you got wrong, and name the specific mistake' },
      { id: 'w5-registered', label: 'Confirm your registration is complete — the deadline is 15 September', critical: true },
    ],
  },
  {
    id: 'week-6',
    weekNumber: 6,
    startDate: '2026-09-14',
    endDate: '2026-09-20',
    focus: 'Speed and switching',
    summary:
      'Accuracy should be in place; now build pace. 20 items in 25 minutes gives an average of 75 seconds per item, so practise walking away from an item that is not yielding rather than rescuing it.',
    milestones: [
      { id: 'w6-pace', label: 'Practise at pace: sets of 20 items in one sitting, one section at a time' },
      { id: 'w6-abandon', label: 'Deliberately practise abandoning a stuck item and moving on' },
      { id: 'w6-mixed', label: 'Do a mixed set across all three sections to practise switching' },
      { id: 'w6-accuracy', label: 'Reach 80% accuracy or better in each section' },
    ],
  },
  {
    id: 'week-7',
    weekNumber: 7,
    startDate: '2026-09-21',
    endDate: '2026-09-26',
    focus: 'Taper and exam day',
    summary:
      'No new material. Light revision, sort out the logistics, and arrive rested. The exam is Saturday 26 September.',
    milestones: [
      { id: 'w7-reread-tips', label: 'Re-read all three section overviews' },
      { id: 'w7-logistics', label: 'Confirm your test centre, travel time and what time to arrive' },
      { id: 'w7-id', label: 'Check your ID or passport matches your registration exactly', critical: true },
      { id: 'w7-pack', label: 'Plan what to leave behind — no phone, watch, calculator or notes on the desk' },
      { id: 'w7-light', label: 'Light practice only in the last two days: ten easy items a day' },
      { id: 'w7-rest', label: 'Rest the day before' },
    ],
  },
]
