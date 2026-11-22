import { PageContainer } from '@/components/layout/page-shell'
import { SubNav, SubNavLayout } from '@/components/layout/sub-nav'
import { SupportLink } from '@/components/support/support-link'
import { EXAM_SECTIONS } from '@/lib/exam-nav'

/**
 * About the Exam, as one subject with an internal sidebar rather than a set of
 * pages you had to return to the landing page to move between.
 *
 * The landing page is the first item in its own list, so "About the Exam" and
 * the six documents under it are visibly one thing. Every URL is unchanged.
 */
export default function ExamLayout({ children }: LayoutProps<'/exam'>) {
  // `max-w-6xl sm:px-6` overrides PageContainer's 1280px to match the public
  // header and footer. This section renders inside the public shell now, and
  // at the application's wider measure its content started 56px outside the
  // header above it. twMerge keeps the className's width, so this replaces
  // PageContainer's rather than fighting it.
  return (
    <PageContainer className="stagger-enter flex max-w-6xl flex-col gap-5 pt-6 pb-12 sm:px-6">
      <SubNavLayout
        nav={
          <SubNav
            label="About the exam"
            links={EXAM_SECTIONS}
            aside={
              <div className="border-border flex flex-col gap-1.5 rounded-xl border p-3.5">
                <b className="text-sm font-semibold">Every claim is sourced</b>
                <span className="text-muted-foreground text-[13px] leading-[19px]">
                  Each fact names the official page it was read from, and when.
                </span>
                <SupportLink className="mt-1" showAim={false} topic="About the exam" />
              </div>
            }
          />
        }
      >
        {children}
      </SubNavLayout>
    </PageContainer>
  )
}
