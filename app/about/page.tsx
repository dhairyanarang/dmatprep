import { Info } from 'lucide-react'

import { SupportEmail } from '@/components/support/support-link'

import { InfoPage } from '@/components/layout/info-page'

export const metadata = { title: 'About this resource' }

/**
 * The full independence statement, in one place a candidate can be sent to.
 *
 * The footer carries the short version on every page, which is where almost
 * everyone will meet it. This is the long version: what the material is, how it
 * was made, what it is not, and what it cannot promise. It is linked from the
 * footer, not from the sidebar — the product has four primary destinations and
 * this is not a fifth.
 *
 * Every claim here is one the provenance records support. Nothing on this page
 * says the material is reviewed or approved, because the GAM packs are not: they
 * sit at `automated-pass` and Module B says so itself.
 */
export default function AboutPage() {
  return (
    <InfoPage
      icon={Info}
      title="About this resource"
      description="What dMAT Prep is, who makes it, and what it does not claim"
      disclaimer={false}
    >

        <section className="space-y-3">
          <h2 className="text-base font-semibold">dMAT Prep is independent</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            dMAT Prep is an independent preparation resource. It is{' '}
            <strong className="text-foreground">
              not affiliated with, endorsed by, or sponsored by
            </strong>{' '}
            g.a.s.t. (Gesellschaft für Akademische Studienvorbereitung und Testentwicklung
            e.&nbsp;V.), APS India, or any examination authority. Nobody connected with the
            examination has reviewed, approved or licensed anything here.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The examination&rsquo;s name is used solely to identify the examination this resource
            prepares candidates for. &ldquo;dMAT&rdquo; is a trademark of g.a.s.t., used here for
            that identification only.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">What the practice material is</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Every practice question, explanation and diagram on dMAT Prep is an independently
            developed educational exercise. None is an official examination question, none is
            reproduced from the live examination, and none is built from anyone&rsquo;s
            recollection of sitting it.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The material is developed from the examination formats that g.a.s.t. describes
            publicly, in its own preparatory materials. Each question is produced to those
            documented formats and then checked by a solver, which confirms it has exactly one
            correct answer before it can be used. Where a question depends on something the
            official material does not settle, it is recorded as such rather than presented as
            fact — the{' '}
            <a className="text-foreground underline underline-offset-2" href="/exam/sources">
              Sources
            </a>{' '}
            page lists every claim this hub makes about the examination against the official
            source it came from.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">What it is not, and cannot promise</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The practice here is intended to help you rehearse the reasoning the examination
            asks for and to become familiar with question formats that are publicly described.{' '}
            <strong className="text-foreground">
              The real examination may differ in its content, its questions, its difficulty and
              its structure.
            </strong>{' '}
            Nothing here predicts what you will be asked.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            dMAT Prep does not guarantee examination results, admission, or any other outcome.
            Any statistic shown to you describes your practice on this site and nothing else.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Official information about the examination — dates, fees, eligibility, registration
            — comes from{' '}
            <a
              className="text-foreground underline underline-offset-2"
              href="https://www.d-mat.de/en/"
              rel="noreferrer noopener"
              target="_blank"
            >
              d-mat.de
            </a>{' '}
            and{' '}
            <a
              className="text-foreground underline underline-offset-2"
              href="https://aps-india.de/dmat/"
              rel="noreferrer noopener"
              target="_blank"
            >
              aps-india.de
            </a>
            . Where this hub and an official source disagree, the official source is right.
            Check them before acting on anything time-sensitive.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Module B is a pilot</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The General Academic Module material is a small pilot that has passed automated
            validation and independent blind checking, but{' '}
            <strong className="text-foreground">has not been signed off by a person</strong>.
            It is labelled as such wherever it appears. Treat it as practice material under
            review rather than as settled answers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Getting in touch</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            If you believe something here infringes your rights, or you have spotted a mistake in
            a question or in a fact about the examination, please write to{' '}
            <SupportEmail topic="Report of claimed infringement or a content error" />
            . Reports of claimed infringement are acknowledged within three working days and the
            material in question is withdrawn from the site while it is looked into.
          </p>
        </section>
    </InfoPage>
  )
}
