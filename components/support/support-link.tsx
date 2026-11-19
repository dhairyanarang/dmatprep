'use client'

import { LifeBuoy } from 'lucide-react'

import { trackEvent } from '@/lib/analytics/client'
import { EVENTS } from '@/lib/analytics/events'

import { OPERATOR, SUPPORT_RESPONSE_AIM, supportMailto } from '@/content/legal/operator'
import { cn } from '@/lib/utils'

/**
 * "Need help?" — the same link everywhere it is needed.
 *
 * Three rules it exists to keep:
 *
 *  · **Graceful when unset.** No support address is configured yet, so this
 *    renders a plain sentence rather than a `mailto:` to nowhere. A broken mail
 *    link at the moment someone's payment has failed is worse than no link.
 *  · **Never asks for credentials.** The suggested message says so explicitly,
 *    because a customer whose payment failed is exactly the person most likely
 *    to volunteer a card number unprompted.
 *  · **Aims, never promises.** 1–2 hours is stated as an aim.
 *
 * The order reference is our own provider order id. It is not a secret and not
 * personal data; it is the one thing that makes a support email answerable
 * without a back-and-forth.
 */
export function SupportLink({
  topic,
  orderRef,
  className,
  showAim = true,
}: {
  topic: string
  orderRef?: string | null
  className?: string
  showAim?: boolean
}) {
  const href = supportMailto({ topic, orderRef })

  if (!href) {
    return (
      <p className={cn('text-muted-foreground text-sm leading-relaxed', className)}>
        Need help? A support address has not been published yet — see the{' '}
        <a className="hover:text-foreground underline underline-offset-2" href="/contact">
          contact page
        </a>
        .
      </p>
    )
  }

  return (
    <div className={cn('text-muted-foreground text-sm leading-relaxed', className)}>
      <a
        className="text-foreground inline-flex items-center gap-1.5 underline underline-offset-2"
        data-support-link={topic}
        href={href}
        onClick={() => trackEvent(EVENTS.supportClicked, { surface: topic, order_ref: orderRef ?? null })}
      >
        <LifeBuoy aria-hidden className="size-3.5 shrink-0" />
        Need help? Contact support
      </a>
      {showAim ? <p className="mt-1.5">{SUPPORT_RESPONSE_AIM}</p> : null}
      {orderRef ? (
        <p className="mt-1 font-mono text-xs">
          Order reference <span className="text-foreground">{orderRef}</span>
        </p>
      ) : null}
    </div>
  )
}

/**
 * The support address rendered inline, inside a sentence.
 *
 * Used by the pages that already asked people to write in — account deletion,
 * infringement reports, repeated errors — so that the address lives in one
 * place instead of three. Falls back to pointing at the contact page rather
 * than rendering a dead link.
 */
export function SupportEmail({ topic }: { topic: string }) {
  const address = OPERATOR.contactEmail
  const href = supportMailto({ topic })
  if (!address || !href) {
    return (
      <a className="text-foreground underline underline-offset-2" href="/contact">
        the contact page
      </a>
    )
  }
  return (
    <a
      className="text-foreground underline underline-offset-2"
      data-support-link={topic}
      href={href}
      onClick={() => trackEvent(EVENTS.supportClicked, { surface: topic })}
    >
      {address}
    </a>
  )
}
