import { PageShell } from '@/components/layout/page-shell'
import { FullMockSitting } from '@/components/practice/full-mock-sitting'
import {
  BREAK_MINUTES,
  CORE_STAGE_MINUTES,
  FULL_MOCK_LABEL,
  GAM_MINUTES,
  fullMockCoreSize,
  fullMockCoreStages,
  fullMockGamPacks,
} from '@/lib/content/full-mock'

export const metadata = { title: 'Full dMAT mock' }

/**
 * The one mock that runs both modules, in the shape of the real examination.
 *
 * The four Core mocks are Module A only. This adds the half that was missing:
 * three Core subtests of 25 minutes, a 30-minute break, then the General
 * Academic Module for 90 minutes — 75 + 30 + 90, the breakdown recorded in
 * `content/exam/claims.ts` as the computed 195 minutes.
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
        breakMinutes={BREAK_MINUTES}
        coreSize={fullMockCoreSize()}
      />
    </PageShell>
  )
}
