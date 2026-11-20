'use client'

import Link from 'next/link'
import { ArrowRight, Check, Lock } from 'lucide-react'

import { ProBadge } from '@/components/layout/sidebar-brand'
import { useProDialog } from '@/components/payments/pro-dialog'
import { SECTION_ICON } from '@/lib/nav'
import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { FREE_PER_SECTION } from '@/lib/payments/free-quota'
import { useEntitlement } from '@/lib/payments/use-entitlement'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'

/**
 * One Core subtest, as the design draws it: a framed panel with the subtest's
 * own coverage ring and, below it, exactly what this account may open.
 *
 * The ring counts distinct questions attempted against what is available to
 * *this* account — the free sample without an entitlement, the whole bank with
 * one. Counting against the whole bank either way would tell a free candidate
 * they had barely started when they had worked through most of what they have.
 *
 * The split between free and paid is stated on every card, in figures counted
 * from the bank at build time. It used to appear only once the purchase flow
 * was switched on, which meant the product running today never said how many
 * questions there were or what the paid half contained.
 */
export function SubtestCard({
  sectionId,
  title,
  oneLiner,
  bankSize,
  index = 0,
}: {
  sectionId: SectionId
  title: string
  oneLiner: string
  bankSize: number
  index?: number
}) {
  // Looked up here rather than passed in: a Lucide icon is a function, and a
  // server component cannot hand a function to a client one.
  const Icon = SECTION_ICON[sectionId]

  const progress = useProgress()
  const ready = useProgressReady()
  const entitlement = useEntitlement()

  const openProDialog = useProDialog()

  const entitled = COMMERCE_ENABLED && entitlement.ready && entitlement.access
  const locked = COMMERCE_ENABLED && entitlement.ready && !entitlement.access
  const available = locked ? FREE_PER_SECTION : bankSize
  // Counted from the active bank, never written down. Retiring one question
  // moves this number and nothing else has to be edited.
  const premium = Math.max(0, bankSize - FREE_PER_SECTION)

  const done = ready
    ? new Set(
        progress.attempts.filter((a) => a.sectionId === sectionId).map((a) => a.questionId),
      ).size
    : 0
  const fraction = available ? Math.min(1, done / available) : 0

  return (
    <article className="panel scard" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="panel-h min-h-11">
        <span className="over">Core · 25 min · 20 tasks</span>
        <span className="text-muted-foreground text-xs">
          {COMMERCE_ENABLED
            ? locked
              ? `${FREE_PER_SECTION} free questions`
              : 'Full bank unlocked'
            : `${bankSize} questions`}
        </span>
      </div>

      <div className="surface flex flex-1 flex-col gap-3.5 p-4">
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden
            className="bg-brand-50 text-brand grid size-11 shrink-0 place-items-center rounded-[10px]"
          >
            <Icon className="size-[22px]" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="flex items-center gap-2 text-base leading-[22px] font-semibold">
              <Link className="stretch" href={`/module-a/${sectionId}`}>
                {title}
              </Link>
              <ArrowRight aria-hidden className="go size-4 shrink-0" />
            </h2>
            <p className="text-muted-foreground text-[13px] leading-[19px]">{oneLiner}</p>
          </div>
        </div>

        {/* Coverage, drawn as the design's ring. A zero-progress ring draws
            nothing rather than a one-pixel cap. */}
        <div className="border-border bg-frame flex items-center gap-3 rounded-[10px] border px-3.5 py-3">
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
            <circle cx="12" cy="12" r="9" fill="none" stroke="var(--brand-50)" strokeWidth="3" />
            {fraction > 0 ? (
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="3"
                strokeDasharray={`${(56.5 * fraction).toFixed(1)} 60`}
                strokeLinecap="round"
                transform="rotate(-90 12 12)"
              />
            ) : null}
          </svg>
          <span className="flex flex-col gap-px">
            <b className="text-sm font-semibold">Your coverage</b>
            <span className="text-muted-foreground text-xs">
              {ready ? `${done} of ${available} seen` : ' '}
            </span>
          </span>
        </div>

        {/* What is in this subtest, and which part of it this account can
            open. Always shown: the figures are facts about the bank, not
            about the purchase flow being switched on. */}
        <dl className="border-soft grid grid-cols-3 gap-2 rounded-[10px] border px-3.5 py-3 text-center">
          <Figure label="Free" value={FREE_PER_SECTION} />
          <Figure label="With Pro" value={`+${premium}`} accent />
          <Figure label="Total" value={bankSize} muted />
        </dl>

        {premium > 0 ? (
          entitled ? (
            <div className="border-gold-line bg-gold-soft flex items-center gap-3 rounded-[10px] border px-3.5 py-3">
              <Check aria-hidden className="text-gold-text size-4 shrink-0" />
              <span className="flex flex-1 flex-col gap-px">
                <b className="text-sm font-semibold">All {bankSize} questions unlocked</b>
                <span className="text-xs text-[#6b4a00]">Including the hardest items</span>
              </span>
              <ProBadge />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => (openProDialog ? openProDialog('prepare-card') : undefined)}
              className="bg-gold-soft hover:bg-gold-tint focus-visible:ring-ring relative z-[2] flex w-full items-center gap-3 rounded-[10px] border border-dashed border-[#e3c98e] px-3.5 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Lock aria-hidden className="text-gold-text size-[18px] shrink-0" />
              <span className="flex flex-1 flex-col gap-px">
                <b className="text-sm font-semibold">{premium} more with Pro</b>
                <span className="text-xs text-[#6b4a00]">
                  Every rule, at every difficulty, with full explanations
                </span>
              </span>
              <ProBadge />
            </button>
          )
        ) : null}
      </div>
    </article>
  )
}

/** One figure in the access strip: a number over its label. */
function Figure({
  label,
  value,
  accent = false,
  muted = false,
}: {
  label: string
  value: number | string
  accent?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dd
        className={`font-mono text-base leading-5 font-medium tabular-nums ${
          accent ? 'text-gold-text' : muted ? 'text-muted-foreground' : 'text-foreground'
        }`}
      >
        {value}
      </dd>
      <dt className="text-muted-foreground text-[11px] leading-4">{label}</dt>
    </div>
  )
}
