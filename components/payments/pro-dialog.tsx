'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Crown, ShieldCheck, X } from 'lucide-react'

import { trackEvent } from '@/lib/analytics/client'
import { EVENTS } from '@/lib/analytics/events'
import { COMMERCE_ENABLED, formatPrice } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'

type Opener = (reason: string) => void

const ProDialogContext = createContext<Opener | null>(null)

/**
 * "What is in Pro", as a dialog you asked for.
 *
 * It opens only from a control someone pressed — a locked card, a lock row, a
 * Pro badge. It never opens on a timer, on arrival, or on a count of
 * questions, and nothing in here ever calls it during a test: a modal over a
 * running clock would take time from a candidate to sell to them, which is
 * the one thing a product like this must not do.
 *
 * The content is the agreed offering and nothing else. No General Academic
 * packs, no pace insights — neither is part of Pro, and a dialog is exactly
 * where an unearned claim does the most damage.
 *
 * It opens whether or not the purchase flow is switched on, because what Pro
 * contains is decided and only the ability to take the money is not. What
 * changes is where the button goes: checkout when there is something to buy,
 * the pricing page when there is not — which says in its own words that
 * nothing is for sale yet. Gating the dialog on the flag made every lock row
 * in the product a button that did nothing at all.
 */
export function ProDialogProvider({ children }: { children: React.ReactNode }) {
  const [reason, setReason] = useState<string | null>(null)
  const entitlement = useEntitlement()

  const open = useCallback<Opener>((why) => {
    setReason(why)
    trackEvent(EVENTS.premiumBuyClicked, { surface: why })
  }, [])

  const close = useCallback(() => setReason(null), [])

  useEffect(() => {
    if (!reason) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [reason, close])

  // Someone who already holds Pro is never shown a pitch for it.
  const show = Boolean(reason) && !(COMMERCE_ENABLED && entitlement.ready && entitlement.access)

  return (
    <ProDialogContext.Provider value={open}>
      {children}
      {show ? <ProDialog onClose={close} /> : null}
    </ProDialogContext.Provider>
  )
}

/** Returns an opener, or null outside the provider. */
export function useProDialog(): Opener | null {
  return useContext(ProDialogContext)
}

function ProDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-auto bg-[rgba(10,10,10,0.42)] p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pro-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-card relative max-h-[calc(100vh-48px)] w-full max-w-[560px] overflow-auto rounded-2xl shadow-[0_24px_64px_rgba(10,10,10,0.28)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="hover:bg-frame focus-visible:ring-ring absolute top-3.5 right-3.5 grid size-8 place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-[18px]" aria-hidden />
        </button>

        <div className="flex flex-col gap-3.5 px-6 pt-6">
          <span className="bg-gold text-gold-dark flex h-6 w-fit items-center gap-1.5 rounded-sm px-2 font-mono text-[11px] font-semibold tracking-[0.04em]">
            <Crown aria-hidden className="size-3" />
            PRO
          </span>
          <div>
            <h2
              id="pro-dialog-title"
              className="pr-8 text-[22px] leading-[30px] font-semibold tracking-[-0.015em]"
            >
              Practise the whole bank, and sit all four mocks
            </h2>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              One payment. Everything below is yours for good — no subscription, and nothing is
              charged again.
            </p>
          </div>
        </div>

        <ul className="mx-6 mt-4 flex list-none flex-col gap-2.5 p-0">
          <Item title="The full active Core question bank">
            every Figure Sequence, system of equations and Latin square we have, with explanations
          </Item>
          <Item title="Four fixed Core mock exams">
            60 questions each — 20 per subtest — in a fixed order, so two sittings can be compared
          </Item>
          <Item title="Timed sets drawn from the whole bank">
            rather than only the free sample, so a set can stay fresh for longer
          </Item>
          <Item title="Lifetime access on your account">
            it does not expire, and it never renews
          </Item>
        </ul>

        <div className="border-gold-line bg-gold-soft mx-6 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3.5">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl leading-7 font-medium">{formatPrice()}</span>
              <span className="text-[#6b4a00]">one time</span>
            </span>
            <span className="text-xs text-[#6b4a00]">
              {COMMERCE_ENABLED
                ? 'The General Academic Module is not part of Pro — it stays free while it is pilot material.'
                : 'Not for sale yet: everything is free while we are in beta.'}
            </span>
          </div>
          <Link href="/pricing" onClick={onClose} className="text-[13px] font-medium">
            Compare plans
          </Link>
        </div>

        <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
          {/* Checkout only exists when there is something to buy. With the
              flow off this goes to pricing, which says so plainly, rather
              than to a route that would 404. */}
          <Link
            href={COMMERCE_ENABLED ? '/checkout' : '/pricing'}
            onClick={onClose}
            className="bg-gold text-gold-dark hover:bg-gold-strong flex h-11 w-full items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold transition-colors"
          >
            {COMMERCE_ENABLED ? 'Unlock Pro' : 'See the plans'}
            <ArrowRight aria-hidden className="size-4" />
          </Link>

          <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck aria-hidden className="text-success size-3.5" />
              Refunds within the published window.{' '}
              <Link href="/refunds" onClick={onClose} className="underline underline-offset-2">
                Refund policy
              </Link>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="hover:text-foreground cursor-pointer border-0 bg-none p-0 text-xs transition-colors"
            >
              Keep practising free
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <Check aria-hidden className="text-brand mt-px size-[18px] shrink-0" />
      <span className="text-sm leading-5">
        <b className="font-semibold">{title}</b>{' '}
        <span className="text-muted-foreground">{children}</span>
      </span>
    </li>
  )
}
