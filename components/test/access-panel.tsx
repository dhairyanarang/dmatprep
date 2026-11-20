'use client'

import Link from 'next/link'
import { Check, Lock } from 'lucide-react'

import { ProBadge } from '@/components/layout/sidebar-brand'
import { useProDialog } from '@/components/payments/pro-dialog'
import { COMMERCE_ENABLED, formatPrice } from '@/lib/payments/config'
import { FREE_PER_SECTION } from '@/lib/payments/free-quota'
import { useEntitlement } from '@/lib/payments/use-entitlement'

/**
 * What the Test page gives you, and what the paid half adds.
 *
 * Stated on the page rather than discovered by clicking a locked card. The
 * free column is not a teaser: timed sets and the open simulation genuinely
 * run on the free sample and are genuinely marked, and saying so is what
 * makes the paid column believable.
 *
 * Shown whether or not the purchase flow is on, and replaced by a single
 * confirmation line once an account holds Pro — nobody needs selling
 * something they have already bought.
 */
export function TestAccessPanel({
  bankSize,
  mockCount,
  mockSize,
}: {
  bankSize: number
  mockCount: number
  mockSize: number
}) {
  const entitlement = useEntitlement()
  const openProDialog = useProDialog()
  const entitled = COMMERCE_ENABLED && entitlement.ready && entitlement.access

  if (entitled) {
    return (
      <section className="border-gold-line bg-gold-soft flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3.5">
        <Check aria-hidden className="text-gold-text size-4 shrink-0" />
        <span className="flex-1 text-sm">
          <b className="font-semibold">Everything on this page is unlocked.</b>{' '}
          <span className="text-muted-foreground">
            All {bankSize} Core questions and all {mockCount} fixed mocks, for good.
          </span>
        </span>
        <ProBadge />
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="panel-h">
        <h2 className="ptitle">What you can sit</h2>
        {COMMERCE_ENABLED ? (
          <span className="text-muted-foreground text-xs">
            Pro is {formatPrice()}, once
          </span>
        ) : null}
      </div>

      <div className="surface grid gap-px sm:grid-cols-2">
        <div className="flex flex-col gap-2.5 p-4">
          <span className="over">Free</span>
          <ul className="flex flex-col gap-2">
            <Line>
              Timed sets for all three subtests, drawn from the free {FREE_PER_SECTION} questions
              each and marked in full
            </Line>
            <Line>The open simulation, planned fresh from those same questions</Line>
            <Line>The diagnostic, and your whole attempt history</Line>
          </ul>
        </div>

        <div className="border-soft flex flex-col gap-2.5 border-t p-4 sm:border-t-0 sm:border-l">
          <span className="flex items-center gap-2">
            <span className="over">Pro</span>
            <ProBadge />
          </span>
          <ul className="flex flex-col gap-2">
            <Line brand>
              <b className="font-medium">
                {mockCount} fixed Core mock exams
              </b>{' '}
              — {mockSize} questions each, 20 from every subtest, in a fixed order
            </Line>
            <Line brand>
              Timed sets and the open simulation drawn from all {bankSize} questions
            </Line>
            <Line brand>Lifetime access on your account — one payment, never renews</Line>
          </ul>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openProDialog?.('test-access-panel')}
              className="bg-gold text-gold-dark hover:bg-gold-strong focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Lock aria-hidden className="size-3.5" />
              What Pro adds
            </button>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground text-sm">
              Compare plans
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Line({ children, brand = false }: { children: React.ReactNode; brand?: boolean }) {
  return (
    <li className="flex gap-2 text-[13px] leading-[19px]">
      <Check
        aria-hidden
        className={`mt-0.5 size-3.5 shrink-0 ${brand ? 'text-gold-text' : 'text-muted-foreground'}`}
      />
      <span className="text-muted-foreground">{children}</span>
    </li>
  )
}
