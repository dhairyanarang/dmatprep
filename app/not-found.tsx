import Link from 'next/link'

import { PageContainer } from '@/components/layout/page-shell'

export const metadata = { title: 'Page not found' }

/**
 * The 404, in the app's own voice.
 *
 * Next's default renders "404: This page could not be found." inside the root
 * layout — so the navigation and the independence statement were already there,
 * but the copy was the framework's and offered nowhere to go. A candidate who
 * mistypes a URL should land somewhere that helps rather than somewhere that
 * merely reports.
 */
export default function NotFound() {
  return (
    <PageContainer className="flex max-w-2xl flex-col gap-6 py-16">
      <div className="space-y-3">
        <p className="text-eyebrow">404</p>
        <h1 className="text-2xl font-medium tracking-tight">That page isn’t here</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The link may be out of date, or the address may have a typo in it. Nothing has gone
          wrong with your progress — it is saved where it was.
        </p>
      </div>

      <nav aria-label="Where to go instead" className="flex flex-col gap-2 text-sm">
        <Link className="text-foreground underline underline-offset-2" href="/">
          Home — your progress at a glance
        </Link>
        <Link className="text-foreground underline underline-offset-2" href="/prepare">
          Prepare — learn and practise
        </Link>
        <Link className="text-foreground underline underline-offset-2" href="/test">
          Test — timed practice and mocks
        </Link>
        <Link className="text-foreground underline underline-offset-2" href="/exam">
          About the exam — format, rules and dates
        </Link>
      </nav>
    </PageContainer>
  )
}
