import { Check, X } from 'lucide-react'

import type { TipsPage } from '@/lib/types/content'

export function TipsView({ tips }: { tips: TipsPage }) {
  return (
    <div className="space-y-10">
      <p className="text-sm leading-relaxed text-pretty">{tips.intro}</p>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Strategy</h2>
        <dl className="space-y-5">
          {tips.strategies.map((tip) => (
            <div key={tip.title} className="space-y-1">
              <dt className="text-sm font-medium">{tip.title}</dt>
              <dd className="text-muted-foreground text-sm leading-relaxed text-pretty">
                {tip.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Common mistakes</h2>
        <dl className="space-y-5">
          {tips.mistakes.map((tip) => (
            <div key={tip.title} className="space-y-1">
              <dt className="text-sm font-medium">{tip.title}</dt>
              <dd className="text-muted-foreground text-sm leading-relaxed text-pretty">
                {tip.body}
              </dd>
            </div>
          ))}
        </dl>
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
