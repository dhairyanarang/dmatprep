import { AlertTriangle, Check, X } from 'lucide-react'

import type { TipsPage } from '@/lib/types/content'

export function TipsView({ tips }: { tips: TipsPage }) {
  return (
    <div className="space-y-10">
      <p className="max-w-prose text-sm leading-relaxed text-pretty">{tips.intro}</p>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold tracking-tight">Strategy</h2>
          <span className="text-muted-foreground text-xs tabular-nums">
            {tips.strategies.length} habits
          </span>
        </div>

        {/* Numbered cards rather than a definition list: at this length a prose
            stream gives no purchase, and the count makes the set feel finite. */}
        <ol className="grid gap-3 sm:grid-cols-2">
          {tips.strategies.map((tip, i) => (
            <li key={tip.title} className="border-border bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="border-border bg-accent text-foreground flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums"
                >
                  {i + 1}
                </span>
                <h3 className="text-sm font-medium">{tip.title}</h3>
              </div>
              <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed">{tip.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight">Common mistakes</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {tips.mistakes.map((tip) => (
            <li key={tip.title} className="border-danger/25 bg-danger-tint/25 rounded-xl border p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="text-danger-fg mt-0.5 size-4 shrink-0" aria-hidden />
                <h3 className="text-sm font-medium">{tip.title}</h3>
              </div>
              <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed">{tip.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="border-success/25 bg-success-tint/40 space-y-3 rounded-xl border p-4">
          <h2 className="text-success-fg text-sm font-semibold">Do</h2>
          <ul className="space-y-2">
            {tips.dos.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed">
                <Check className="text-success-fg mt-1 size-3.5 shrink-0" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-danger/25 bg-danger-tint/40 space-y-3 rounded-xl border p-4">
          <h2 className="text-danger-fg text-sm font-semibold">Don’t</h2>
          <ul className="space-y-2">
            {tips.donts.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed">
                <X className="text-danger-fg mt-1 size-3.5 shrink-0" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
