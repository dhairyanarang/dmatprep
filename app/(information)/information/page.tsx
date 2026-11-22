import Link from 'next/link'
import { ArrowRight, FileText, Mail, ShieldCheck } from 'lucide-react'

import { SubPage } from '@/components/layout/sub-nav'
import { canonical } from '@/lib/seo'

export const metadata = {
  title: 'Information',
  description: 'Who runs dMAT Prep, what it stores, and the terms it is offered under',
  alternates: { canonical: canonical('/information') },
}
/**
 * The Information landing page.
 *
 * It exists so the section has a front door rather than opening on whichever
 * policy happened to be first. Each card says what the page is *for*, because
 * "Terms" tells you the title and not whether it is the one you need.
 */
const CARDS = [
  {
    href: '/contact',
    icon: Mail,
    title: 'Help and contact',
    body: 'How to reach a person, what to include, and how long a reply usually takes.',
  },
  {
    href: '/privacy',
    icon: ShieldCheck,
    title: 'Your data',
    body: 'Everything stored about you, where it is kept, and how to remove it.',
  },
  {
    href: '/terms',
    icon: FileText,
    title: 'Terms',
    body: 'The terms this resource is offered under, what it does not promise, and when a payment can be refunded.',
  },
] as const

export default function InformationPage() {
  return (
    <SubPage
      title="Information"
      description={`Who runs dMAT Prep, what it stores, and the terms it is offered under. Everything here is plain and short on purpose.`}
    >
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr))]">
        {CARDS.map(({ href, icon: Icon, title, body }) => (
          <Link
            key={href}
            href={href}
            className="scard border-border bg-card flex flex-col gap-2.5 rounded-xl border p-4"
          >
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="bg-brand-50 text-brand grid size-8 shrink-0 place-items-center rounded-lg"
              >
                <Icon className="size-4" />
              </span>
              <b className="flex-1 text-sm font-semibold">{title}</b>
              <ArrowRight aria-hidden className="go size-4 shrink-0" />
            </span>
            <span className="text-muted-foreground text-[13px] leading-[19px]">{body}</span>
          </Link>
        ))}
      </div>

      <section className="panel">
        <div className="panel-h">
          <h2 className="ptitle">Who runs this</h2>
        </div>
        <div className="surface flex flex-col gap-2 p-4">
          {/* No operator name here. `content/legal/operator.ts` leaves the
              legal name deliberately undecided, and a page that filled it in
              would be inventing the one fact those documents exist to state
              accurately. */}
          <p className="text-sm leading-relaxed">
            dMAT Prep is an independent preparation resource. It is not affiliated with, endorsed
            by, or sponsored by g.a.s.t. or APS India, and no question here is official
            examination material.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Nobody connected with the examination has reviewed or approved anything here, and
            nothing on this site has been signed off by a person at g.a.s.t. or APS India. Every
            factual claim about the exam traces to an official source, listed with the date it was
            read on the{' '}
            <Link href="/dashboard/exam/sources" className="underline underline-offset-2">
              sources page
            </Link>
            .
          </p>
        </div>
      </section>
    </SubPage>
  )
}
