'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronLeft, Lock } from 'lucide-react'

import { GoogleButton } from '@/components/auth/google-button'
import { EdgeConfetti } from '@/components/payments/edge-confetti'
import { PurchaseButton } from '@/components/payments/purchase-button'
import { ProBadge } from '@/components/layout/sidebar-brand'
import { SupportLink } from '@/components/support/support-link'
import { useAuth } from '@/lib/auth/use-auth'
import { ACCESS_IS_LIFETIME, formatPrice } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'

/**
 * The checkout page's body.
 *
 * Two numbered steps, because there genuinely are two: the account the access
 * attaches to, and the payment. Neither is theatre — without the first there
 * is nothing to attach an entitlement to, and the second is the only button on
 * the page that charges anything.
 *
 * It takes over the viewport, like the exam runner does. Checkout is not a
 * page of the app with navigation down the side; it is one task with one way
 * out, and it carries its own header saying so. Rendered inside the shell it
 * had two headers and a sidebar inviting the buyer somewhere else mid-payment.
 */
export function CheckoutView({
  bankSize,
  mockCount,
  mockSize,
}: {
  bankSize: number
  mockCount: number
  mockSize: number
}) {
  const auth = useAuth()
  const entitlement = useEntitlement()

  const signedIn = auth.status === 'authenticated'

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  /**
   * Did Pro become active while this screen was open?
   *
   * The distinction is presentation only — both states are the SERVER'S
   * answer, read from `/api/entitlement`. What it changes is the tone: someone
   * who has just paid is congratulated and gets the confetti; someone who
   * arrived at checkout already holding Pro is told so calmly, because they
   * did not just do anything.
   *
   * Set by the purchase button, after the server verified the payment and the
   * entitlement was re-read. Inferring it from a state transition was the
   * first attempt and it was guesswork; this is the payment telling us.
   *
   * It only changes the TONE. What the screen says is unlocked comes from
   * `entitlement.access`, which is the server's answer either way.
   */
  const [justPaid, setJustPaid] = useState(false)
  const onVerified = useCallback(() => setJustPaid(true), [])

  const justActivated = entitlement.ready && entitlement.access && justPaid

  if (entitlement.ready && entitlement.access) {
    return (
      <div className="bg-frame fixed inset-0 z-50 overflow-auto">
        {justActivated ? <EdgeConfetti /> : null}

        {/* Above the bursts, which sit at z-0. This is what lets the confetti
            cross the middle of the screen without touching the legibility of
            the heading, the account or the buttons. */}
        <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[560px] flex-col justify-center px-4 py-12 sm:px-6">
          <div className="border-gold-line bg-card relative flex flex-col gap-5 rounded-2xl border p-6 sm:p-8">
            <div className="flex flex-col gap-3">
              <span
                aria-hidden
                className="bg-gold text-gold-dark grid size-11 place-items-center rounded-xl"
              >
                <Check className="size-6" strokeWidth={2.5} />
              </span>

              <div>
                <h1 className="text-2xl leading-8 font-semibold tracking-[-0.015em]">
                  {justActivated ? 'Your Pro is now active!' : 'You already have Pro'}
                </h1>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {justActivated
                    ? 'Payment confirmed. Everything below is unlocked on your account from now on.'
                    : 'Everything below is unlocked on your account, and nothing will be charged again.'}
                </p>
              </div>
            </div>

            {/* The account it landed on. After a payment this is the one fact
                worth confirming without being asked for it. */}
            <div
              className="border-soft bg-frame flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3"
              data-clarity-mask="true"
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-muted-foreground text-xs">Active on</span>
                <b className="truncate text-sm font-medium">
                  {auth.user?.email ?? auth.user?.name ?? 'this account'}
                </b>
              </span>
              <ProBadge />
            </div>

            <ul className="flex flex-col gap-2.5">
              <Unlocked>
                <b className="font-medium">Lifetime access</b> — paid once, it does not expire and
                never renews
              </Unlocked>
              <Unlocked>
                <b className="font-medium">All {bankSize} Core questions</b>, with full
                explanations and distractor notes
              </Unlocked>
              <Unlocked>
                <b className="font-medium">
                  {mockCount} fixed Core mock exams
                </b>{' '}
                — {mockSize} questions each, 20 from every subtest
              </Unlocked>
            </ul>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="bg-brand text-brand-foreground hover:bg-brand-strong inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors"
              >
                Go to your dashboard
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link
                href="/account"
                className="border-border bg-card hover:bg-frame inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium transition-colors"
              >
                Manage membership
              </Link>
            </div>
          </div>

          <p className="text-muted-foreground mt-4 px-1 text-xs leading-relaxed">
            A receipt comes from our payment provider by email.{' '}
            <Link href="/terms" className="underline underline-offset-2">
              Terms
            </Link>
            .
          </p>
          <SupportLink
            className="mt-2 px-1"
            showAim={false}
            topic="Question about my Pro purchase"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-frame fixed inset-0 z-50 flex flex-col overflow-auto">
      <header className="border-line2 bg-card flex h-14 shrink-0 items-center justify-between gap-3 border-b px-6">
        <Link
          href="/pricing"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Back to plans
        </Link>
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <span
            aria-hidden
            className="bg-foreground text-background grid size-6 place-items-center rounded-[5px] text-[13px]"
          >
            D
          </span>
          dMAT Prep
        </span>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[13px]">
          <Lock aria-hidden className="size-3.5" />
          <span className="hidden sm:inline">Secure checkout</span>
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-wrap items-start gap-6 px-4 py-10 sm:px-8">
        <section className="flex min-w-0 flex-[3_1_420px] flex-col gap-4">
          <h1 className="text-2xl leading-8 font-semibold tracking-[-0.015em]">Unlock Pro</h1>

          <Step
            number={1}
            title="The account it attaches to"
            done={signedIn}
          >
            {signedIn ? (
              <div className="border-soft bg-frame flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3">
                <span className="flex min-w-0 flex-col" data-clarity-mask="true">
                  <b className="truncate text-sm font-medium">
                    {auth.user?.name ?? 'Signed in'}
                  </b>
                  <span className="text-muted-foreground truncate text-xs">
                    {auth.user?.email}
                  </span>
                </span>
                <Link href="/account" className="text-[13px] font-medium">
                  Account
                </Link>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Access is held against an account, so buying needs one. Everything you have
                  already answered as a guest comes with you when you sign in.
                </p>
                <GoogleButton next="/checkout" label="Sign in to continue" />
              </>
            )}
          </Step>

          <Step number={2} title="Payment" done={false}>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Razorpay&rsquo;s window opens over this page for UPI, cards or netbanking. Your card
              details go to them and never to us — we are told whether the payment succeeded, and
              nothing else about it.
            </p>
            {signedIn ? (
              <PurchaseButton bankSize={bankSize} onVerified={onVerified} />
            ) : (
              // The purchase button has its own signed-out state, which is the
              // right one on the pricing page and wrong here: it would repeat
              // step 1 word for word, directly underneath step 1.
              <p className="border-soft bg-frame text-muted-foreground rounded-lg border px-3.5 py-3 text-sm">
                Finish step 1 and the payment button appears here.
              </p>
            )}
          </Step>
        </section>

        <aside className="flex min-w-0 flex-[2_1_320px] flex-col gap-3">
          <section className="border-gold-line bg-gold-soft rounded-xl border p-5">
            <p className="over mb-3">Order summary</p>

            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="bg-gold text-gold-dark grid size-10 shrink-0 place-items-center rounded-lg"
              >
                <Lock className="size-4" />
              </span>
              <span className="flex flex-col">
                <b className="text-sm font-semibold">dMAT Prep Pro</b>
                <span className="text-muted-foreground text-xs">
                  {ACCESS_IS_LIFETIME ? 'Lifetime access on this account' : 'One-time access'}
                </span>
              </span>
            </div>

            <ul className="border-gold-line text-muted-foreground mt-4 flex flex-col gap-1.5 border-t pt-4 text-[13px]">
              <li>All {bankSize} Core questions, with full explanations</li>
              <li>
                {mockCount} fixed Core mock exams, {mockSize} questions each
              </li>
              <li>Timed subtests drawn from the whole bank</li>
            </ul>

            <div className="border-gold-line mt-4 flex items-baseline justify-between border-t pt-4">
              <span className="text-sm font-semibold">Total today</span>
              <span className="font-mono text-xl font-medium">{formatPrice()}</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              One payment. No subscription, and nothing is charged again.
            </p>
          </section>

          {/* Stated before the payment button, not after it and not only in
              a document nobody opens. Pro is delivered in full at once, so a
              change of mind is not refundable — and saying so here is the
              difference between a policy and a surprise. It does not claim
              anything about rights that exist in law regardless. */}
          <div className="border-border bg-card flex flex-col gap-1.5 rounded-xl border p-3.5">
            <b className="text-sm font-semibold">Before you pay</b>
            <p className="text-muted-foreground text-[13px] leading-[19px]">
              Everything unlocks immediately, so we do not refund a change of mind. If something
              goes wrong — a duplicate charge, or a payment that does not grant access — write to
              us and we will put it right. Your rights under consumer law are unaffected.
            </p>
            <p className="text-muted-foreground text-xs">
              Paying accepts the{' '}
              <Link href="/terms" className="underline underline-offset-2">
                Terms
              </Link>
              , which cover this in full.
            </p>
          </div>

          <SupportLink className="px-1" showAim={false} topic="Question before buying Pro" />
        </aside>
      </main>
    </div>
  )
}

function Unlocked({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm leading-5">
      <Check aria-hidden className="text-gold-text mt-px size-4 shrink-0" />
      <span>{children}</span>
    </li>
  )
}

function Step({
  number,
  title,
  done,
  children,
}: {
  number: number
  title: string
  done: boolean
  children: React.ReactNode
}) {
  return (
    <section className="border-border bg-card flex flex-col gap-3 rounded-xl border p-5">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={`grid size-[22px] place-items-center rounded-full text-xs font-semibold ${
            done ? 'bg-success text-white' : 'bg-foreground text-background'
          }`}
        >
          {number}
        </span>
        <b className="text-sm font-semibold">{title}</b>
      </div>
      {children}
    </section>
  )
}
