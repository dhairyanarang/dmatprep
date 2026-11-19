import Link from 'next/link'
import { Lock } from 'lucide-react'

import { formatPrice } from '@/lib/payments/config'

/**
 * What a question looks like when its answer is not ours to show.
 *
 * Shown in place of the options and the feedback, not after an attempt. That
 * ordering is the point: a question whose solution is withheld cannot be
 * graded, so it must not be answerable either. Letting someone choose and then
 * telling them nothing — or worse, marking them wrong — is the failure this
 * replaces.
 *
 * It is a courtesy, not a security control. The protection is that the bytes
 * never leave the server without an entitlement check
 * (`app/api/content/solutions/route.ts`); this is what the person sees when
 * that check says no.
 */
export function PremiumLocked({ questionId }: { questionId?: string }) {
  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <div className="flex items-center gap-2.5">
        <Lock aria-hidden className="text-muted-foreground size-4 shrink-0" />
        <p className="text-foreground text-sm font-medium">Part of Premium</p>
      </div>

      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        This question&rsquo;s answer and explanation are part of paid access. Everything you have
        already practised stays free, and nothing here has been marked right or wrong.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          className="text-foreground text-sm font-medium underline underline-offset-4"
          href="/pricing"
        >
          See what Premium includes — {formatPrice()}, one time
        </Link>
        {questionId ? (
          <span className="text-muted-foreground font-mono text-xs">{questionId}</span>
        ) : null}
      </div>
    </div>
  )
}
