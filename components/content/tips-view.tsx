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
        <div className="space-y-3 rounded-lg border border-emerald-600/30 p-4">
          <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Do</h2>
          <ul className="space-y-2">
            {tips.dos.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 rounded-lg border border-rose-600/30 p-4">
          <h2 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Don’t</h2>
          <ul className="space-y-2">
            {tips.donts.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed">
                <X
                  className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
