'use client'

import { ProvenanceTag, type Provenance } from '@/components/content/provenance'
import { Checkbox } from '@/components/ui/checkbox'
import { useProgress, useProgressActions } from '@/lib/progress/use-progress'

/**
 * The checklist, ticked off against the existing milestone store.
 *
 * Every official line traces to a claim already in `content/exam/claims.ts`;
 * the advice lines are marked as ours so nothing here can be mistaken for a
 * requirement g.a.s.t. has published.
 */
const GROUPS: { title: string; items: { id: string; kind: Provenance; text: string }[] }[] = [
  {
    title: 'Before the deadline',
    items: [
      {
        id: 'chk-register',
        kind: 'official',
        text: 'Register through the g.a.s.t. participant portal and pay the €150 fee. Registration closes 15 September 2026.',
      },
      {
        id: 'chk-id-match',
        kind: 'official',
        text: 'Make sure the ID or passport you will bring is the same document you gave at registration — without it you are not admitted.',
      },
      {
        id: 'chk-centre',
        kind: 'official',
        text: 'Confirm your test centre. There are ten in India plus Kathmandu in Nepal.',
      },
      {
        id: 'chk-travel',
        kind: 'recommendation',
        text: 'Work out your journey and plan to arrive early. Arriving after materials are distributed means you are not admitted, so leave a margin.',
      },
    ],
  },
  {
    title: 'What you bring',
    items: [
      {
        id: 'chk-bring-id',
        kind: 'official',
        text: 'A valid ID card or passport. It is the only item allowed on your desk.',
      },
      {
        id: 'chk-leave-behind',
        kind: 'official',
        text: 'Leave behind phones, tablets, mp3 players, wristwatches including smartwatches, fitness watches, calculators and any other electronic device. Devices must be switched off, not silenced.',
      },
      {
        id: 'chk-no-notes',
        kind: 'official',
        text: 'No notes, notice paper or reference books — including during the break.',
      },
    ],
  },
  {
    title: 'On the day',
    items: [
      {
        id: 'chk-timing',
        kind: 'official',
        text: 'Three Core subtests of 25 minutes each, a 30-minute break, then 90 minutes for the Subject Module.',
      },
      {
        id: 'chk-stay',
        kind: 'official',
        text: 'You may not leave the building, and may not leave the room until the module ends. The lavatory is available only during the break the test centre specifies.',
      },
      {
        id: 'chk-guess',
        kind: 'official',
        text: 'If you do not know an answer, guess — the instructions say so directly.',
      },
      {
        id: 'chk-pace',
        kind: 'recommendation',
        text: 'Practise walking away from a question that is not yielding. 20 items in 25 minutes averages 75 seconds each, and rescuing one costs you two.',
      },
    ],
  },
  {
    title: 'Preparation',
    items: [
      {
        id: 'chk-read-guides',
        kind: 'recommendation',
        text: 'Read all three section overviews at least once, so no task type is unfamiliar on the day.',
      },
      {
        id: 'chk-no-paper',
        kind: 'recommendation',
        text: 'Practise without notes or external working, because notes are not permitted in the exam.',
      },
      {
        id: 'chk-mock',
        kind: 'recommendation',
        text: 'Sit at least one full timed practice test. Accuracy under a clock is a different skill from accuracy without one.',
      },
    ],
  },
]

export function ChecklistItems() {
  const progress = useProgress()
  const { toggleMilestone } = useProgressActions()

  return (
    <div className="space-y-8">
      {GROUPS.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">{group.title}</h2>
          <ul className="space-y-2">
            {group.items.map((item) => {
              const checked = Boolean(progress.milestones[item.id])
              return (
                <li key={item.id} className="border-border bg-card rounded-xl border p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleMilestone(item.id)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1 space-y-1.5">
                      <ProvenanceTag kind={item.kind} />
                      <span
                        className={cnText(checked)}
                      >
                        {item.text}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** Ticked items fade, but stay legible — the list is a record, not a disappearing act. */
function cnText(checked: boolean) {
  return checked
    ? 'block text-sm leading-relaxed text-muted-foreground line-through'
    : 'block text-sm leading-relaxed'
}
