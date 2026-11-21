import { PageShell } from '@/components/layout/page-shell'
import { FullMockSitting } from '@/components/practice/full-mock-sitting'
import {
  BREAK_MINUTES,
  CORE_STAGE_MINUTES,
  FULL_MOCK_LABEL,
  GAM_MINUTES,
  OFFICIAL_GAM_MINUTES,
  OFFICIAL_GAM_QUESTIONS_APPROX,
  fullMockCoreSize,
  fullMockCoreStages,
  fullMockGamPacks,
  fullMockGamSize,
} from '@/lib/content/full-mock'

export const metadata = { title: 'Core + GAM sample simulation' }

/**
 * The one sitting that runs both modules — as a SAMPLE, not a full-length mock.
 *
 * The four Core mocks are Module A only. This adds the half that was missing,
 * and is honest about how much of it we have: three Core subtests of 25 minutes
 * (complete, and the official shape), a 30-minute break, then 10 General
 * Academic questions in 15 minutes.
 *
 * **Fifteen, not the official ninety.** The real module is 90 minutes for
 * approximately 60 questions, about 90 seconds each. Ten questions on a
 * 90-minute clock would have reproduced the duration and destroyed the pace,
 * which is the property every account of the real sitting names as the
 * difficulty. 15 minutes is those 10 questions at the official rate. When the
 * General Academic bank reaches full length, the clock scales back up with it —
 * `scripts/build-full-mock.mjs` derives it rather than hard-coding it.
 *
 * Its Core questions are disjoint from all four Core mocks, so working through
 * those does not spoil this sitting. The question lists are committed in
 * `content/access/full-mock.json`; nothing is planned at request time.
 */
export default function FullMockPage() {
  return (
    <PageShell wide>
      {/* The runners are a takeover with their own chrome, so no visible title
          carries the h1 — but the page still needs one, or a screen reader
          lands here with nothing above the sidebar's own headings. */}
      <h1 className="sr-only">{FULL_MOCK_LABEL}</h1>
      <FullMockSitting
        coreStages={fullMockCoreStages()}
        gamPacks={fullMockGamPacks()}
        coreMinutesPerStage={CORE_STAGE_MINUTES}
        gamMinutes={GAM_MINUTES}
        gamQuestionCount={fullMockGamSize()}
        officialGamMinutes={OFFICIAL_GAM_MINUTES}
        officialGamQuestions={OFFICIAL_GAM_QUESTIONS_APPROX}
        breakMinutes={BREAK_MINUTES}
        coreSize={fullMockCoreSize()}
      />
    </PageShell>
  )
}
