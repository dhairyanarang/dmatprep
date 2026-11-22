import { PageContainer } from '@/components/layout/page-shell'
import { SubNav, SubNavLayout } from '@/components/layout/sub-nav'
import { SupportLink } from '@/components/support/support-link'
import { APP_EXAM_BASE, examSections } from '@/lib/exam-nav'

/**
 * About the Exam, inside the application.
 *
 * The same seven documents the public site serves at `/exam`, rendered from
 * the same page components, but within the product: application sidebar,
 * this internal navigation, and the application's own measure. A student who
 * opens About the Exam from the sidebar stays in the product; the only way
 * back out to the public site is the sidebar's "Visit website" link.
 *
 * It keeps `PageContainer`'s default 1280px — the application's measure, and
 * the width this section had before there was a public site at all. The
 * public copy's layout narrows to the public header's measure instead. That
 * is the single difference between the two layouts, and it is why there are
 * two of them rather than one shared file.
 */
export default function AppExamLayout({ children }: LayoutProps<'/dashboard/exam'>) {
  return (
    <PageContainer className="stagger-enter flex flex-col gap-5 pt-6 pb-12">
      <SubNavLayout
        nav={
          <SubNav
            label="About the exam"
            links={examSections(APP_EXAM_BASE)}
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
