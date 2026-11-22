'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { rebaseExamHref } from '@/lib/exam-nav'

/**
 * A link to another page of the exam reference, from inside the exam reference.
 *
 * The seven pages are rendered at two URLs — `/exam/...` on the public site
 * and `/dashboard/exam/...` in the application — from one set of components.
 * A plain `<Link href="/exam/format">` is therefore right in one tree and
 * wrong in the other: in the application it would hand a student who is
 * mid-preparation to the public website, which is the bug this exists to
 * prevent.
 *
 * Written as the canonical public path at every call site, and rebased here
 * from the current pathname. Only links *within* the reference go through
 * this; a link out to the rest of the product is still a plain `Link`.
 */
export function ExamLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  return (
    <Link href={rebaseExamHref(href, pathname)} className={className}>
      {children}
    </Link>
  )
}
