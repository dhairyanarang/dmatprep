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
        <p className="text-foreground text-sm font-medium">Part of Pro</p>
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
          See what Pro includes — {formatPrice()}, one time
        </Link>
        {questionId ? (
          <span className="text-muted-foreground font-mono text-xs">{questionId}</span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * A timed test that refuses to start because it could not be marked honestly.
 *
 * Practice can show a locked question in place and carry on — one item is
 * simply not graded, and the set's accuracy is computed from the rest. A timed
 * test cannot do that. It marks everything at the end, in one pass, and
 * `isCorrect` returns false for a question whose solution was withheld. So a
 * free candidate who sat a mock half-drawn from paid material would be shown a
 * score that reads as theirs and is not: every withheld item counted as a
 * mistake they did not make.
 *
 * So the test does not run. This is the one gate in the product that is not
 * merely presentational — whether it opens is decided by whether the server
 * actually handed over the answers, which no client flag can forge. Someone
 * who defeated every lock in the interface would arrive here all the same,
 * because the question being asked is not "may I" but "can this be marked".
 */
export function TestUnmarkable({ withheld, total }: { withheld: number; total: number }) {
  return (
    <div className="border-gold-line bg-gold-soft rounded-2xl border p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="bg-gold-tint text-gold-text flex size-7 shrink-0 items-center justify-center rounded-lg">
          <Lock aria-hidden className="size-4" />
        </span>
        <p className="text-foreground text-sm font-semibold">This test is part of Pro</p>
      </div>

      <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed">
        {withheld} of its {total} questions come from the paid bank, so this sitting could not be
        marked accurately — and a score that counted those {withheld} as mistakes would not be
        yours. Rather than show you a wrong number, it does not start.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <Link
          href="/pricing"
          className="bg-gold text-gold-dark hover:bg-gold-strong inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-semibold transition-colors"
        >
          Unlock Pro — {formatPrice()}, one time
        </Link>
        <Link
          href="/practice"
          className="text-muted-foreground hover:text-foreground text-sm font-medium underline underline-offset-4 transition-colors"
        >
          Keep practising free
        </Link>
      </div>
    </div>
  )
}
