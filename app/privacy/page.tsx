import { ShieldCheck } from 'lucide-react'

import { SupportEmail } from '@/components/support/support-link'

import { InfoPage } from '@/components/layout/info-page'

export const metadata = { title: 'Your data' }

/**
 * The minimum honest disclosure, and no more.
 *
 * Not a legal document and not a compliance exercise: a candidate deciding
 * whether to sign in deserves a plain answer to "where does my practice go?",
 * and that answer fits on one screen. It is linked from the account menu, which
 * is the only place the question comes up.
 */
export default function PrivacyPage() {
  return (
    <InfoPage
      icon={ShieldCheck}
      title="Your data"
      description="What dMAT Prep stores, and where"
    >

        <section className="space-y-3">
          <h2 className="text-base font-semibold">If you do not sign in</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Everything stays in this browser. Your answers, which questions you have seen, your
            hint use and any session in progress are written to this device&rsquo;s local storage
            and sent nowhere. Clearing your browser data deletes them, and nobody — including us —
            can recover them.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">If you sign in with Google</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We receive your name, email address and profile picture from Google, and store your
            practice history so it follows you to other devices: each attempt, the sessions you
            have sat, which questions you have been shown, and your study-plan milestones. That is
            the whole list. We do not receive your Google password, and we ask for nothing beyond
            basic profile information.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your practice records are readable only by your own account. They are never sold and
            never used to train anything.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">How we see the site being used</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We use third-party analytics tools to understand how dMAT Prep is used — which pages
            help, where people get stuck — so that we can improve it. We never send them your name,
            email address or account details. They run only on the live site, not on a developer&rsquo;s
            machine.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Leaving</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Signing out clears this browser&rsquo;s copy of your progress; the cloud copy is
            untouched and returns when you sign back in. To have the account and everything in it
            deleted, email{' '}
            <SupportEmail topic="Account deletion request" />{' '}
            and it will be removed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">This is a beta</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            dMAT Prep is an independent preparation tool. It is not affiliated with g.a.s.t., APS
            India, or any body that administers the dMAT, and nothing here is an official
            statement about the exam. Every factual claim is listed against its source on the{' '}
            <a href="/exam/sources" className="text-foreground underline underline-offset-2">
              Sources
            </a>{' '}
            page.
          </p>
        </section>
    </InfoPage>
  )
}
