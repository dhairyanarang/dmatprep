import { SupportLink } from '@/components/support/support-link'
import { PageContainer } from '@/components/layout/page-shell'
import { SubNav, SubNavLayout } from '@/components/layout/sub-nav'
import { EXAM_SECTIONS } from '@/lib/exam-nav'

/**
 * About the Exam, as one subject with an internal sidebar rather than a set of
 * pages you had to return to the landing page to move between.
 *
 * The landing page is the first item in its own list, so "About the Exam" and
 * the six documents under it are visibly one thing. Every URL is unchanged.
 */
export default function ExamLayout({ children }: LayoutProps<'/exam'>) {
  return (
    <div className="page-wash">
      <PageContainer className="stagger-enter flex flex-col gap-5 pt-6 pb-12">
        <SubNavLayout
          nav={
            <SubNav
              label="About the exam"
              links={EXAM_SECTIONS}
              aside={
                <div className="border-border flex flex-col gap-1.5 rounded-xl border p-3.5">
                  <b className="text-sm font-semibold">Every claim is sourced</b>
                  <span className="text-muted-foreground text-[13px] leading-[19px]">
                    Nothing on these pages is written from memory. Each fact names the official
                    page it was read from, and when.
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
    </div>
  )
}
