import { PageContainer } from '@/components/layout/page-shell'
import { SubNav, SubNavLayout } from '@/components/layout/sub-nav'
import { SupportLink } from '@/components/support/support-link'
import { INFO_LINKS } from '@/lib/nav'

/**
 * Information: who runs this, and the policies.
 *
 * A route group, so every page keeps the URL it has always had — `/terms` is
 * still `/terms`. What changes is that they are visibly one section with an
 * internal sidebar, rather than six leaves of a dropdown that had to be
 * reopened from the navigation each time.
 */
export default function InformationLayout({ children }: LayoutProps<'/'>) {
  return (
    <PageContainer className="stagger-enter flex flex-col gap-5 pt-6 pb-12">
      <SubNavLayout
        nav={
          <SubNav
            label="Information"
            links={INFO_LINKS.map(({ href, label }) => ({ href, label }))}
            aside={
              <div className="border-border flex flex-col gap-1.5 rounded-xl border p-3.5">
                <b className="text-sm font-semibold">Still stuck?</b>
                <span className="text-muted-foreground text-[13px] leading-[19px]">
                  Anything these pages do not answer, ask a person.
                </span>
                <SupportLink className="mt-1" showAim topic="Question about dMAT Prep" />
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
