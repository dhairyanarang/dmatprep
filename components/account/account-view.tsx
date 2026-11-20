'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, CloudOff, RefreshCw, Sparkles, Trash2, UserRound } from 'lucide-react'

import { GoogleButton } from '@/components/auth/google-button'
import { SupportLink } from '@/components/support/support-link'
import { Panel } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth, useAuthActions } from '@/lib/auth/use-auth'
import { COMMERCE_ENABLED, formatPrice } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'
import {
  useProgress,
  useProgressActions,
  useProgressReady,
  useSyncState,
} from '@/lib/progress/use-progress'

/**
 * The account page: who you are, what is stored, and what it can open.
 *
 * It exists because the top bar's popover could not answer the questions that
 * need more than a line — where is my work actually kept, what does this
 * account unlock, how do I get rid of it. The popover keeps the two things you
 * do in a hurry; this holds the rest.
 *
 * Everything here is read from state the product already keeps. Nothing new is
 * fetched, and in particular there is no purchase history: the entitlement
 * endpoint returns whether access is held, not when it was bought or for how
 * much, and a receipt invented from the first of those would be a fiction.
 * Asking for one goes to a person instead.
 *
 * Guest mode is a supported mode, so with no authentication configured this
 * renders the whole page minus every sign-in affordance, rather than an error
 * or an empty state.
 */
export function AccountView() {
  const auth = useAuth()

  return (
    <div className="flex flex-col gap-4">
      <IdentityCard />
      {COMMERCE_ENABLED ? <MembershipSection /> : null}
      <ProgressSection />
      <DataSection signedIn={auth.status === 'authenticated'} />
    </div>
  )
}

/* ----------------------------------------------------------------- identity */

function IdentityCard() {
  const auth = useAuth()
  const { signOut } = useAuthActions()
  const { status, pending } = useSyncState()

  if (auth.status === 'loading') {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">Checking your account…</p>
        </CardContent>
      </Card>
    )
  }

  const user = auth.user

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="bg-muted text-foreground/70 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
          >
            {user?.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element --
                 an arbitrary remote avatar URL; see components/auth/account-menu.tsx. */
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <UserRound className="size-5" />
            )}
          </span>

          {/* Redacted in session replays — the one page that shows both. */}
          <div className="min-w-0 flex-1" data-clarity-mask="true">
            <p className="truncate text-base font-semibold">
              {user?.name ?? (user ? 'Signed in' : 'Not signed in')}
            </p>
            <p className="text-muted-foreground mt-0.5 truncate text-sm">
              {user?.email ?? 'Your work is saved in this browser.'}
            </p>
          </div>
        </div>

        {user ? (
          <>
            <SyncLine status={status} pending={pending} />
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </>
        ) : auth.status === 'guest' ? (
          <div className="border-border space-y-3 border-t pt-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Everything you have done is already saved, here on this device. Signing in copies it
              to your account so it survives a cleared browser and follows you to a phone —
              nothing is locked behind it.
            </p>
            <GoogleButton size="sm" variant="outline" className="w-fit" />
          </div>
        ) : (
          // status === 'unavailable': no accounts on this deployment. Guest mode
          // is a supported mode, not a degraded one, so this states the position
          // rather than apologising for it.
          <p className="text-muted-foreground border-border border-t pt-4 text-sm leading-relaxed">
            Accounts are not enabled here, so everything is kept in this browser and nothing is
            sent anywhere. Clearing your browser data clears your progress with it.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SyncLine({ status, pending }: { status: string; pending: number }) {
  const [icon, text] =
    pending > 0 && status === 'offline'
      ? [<CloudOff key="i" className="size-3.5" aria-hidden />, `${pending} waiting to sync`]
      : pending > 0
        ? [
            <RefreshCw
              key="i"
              className="size-3.5 motion-safe:animate-spin motion-safe:[animation-duration:2s]"
              aria-hidden
            />,
            `Saving ${pending}…`,
          ]
        : [<Check key="i" className="size-3.5" aria-hidden />, 'Progress saved to your account']

  return (
    <p className="text-muted-foreground border-border flex items-center gap-1.5 border-y py-2.5 text-xs">
      {icon}
      {text}
    </p>
  )
}

/* --------------------------------------------------------------- membership */

function MembershipSection() {
  const entitlement = useEntitlement()
  if (!entitlement.ready) return null

  if (entitlement.access) {
    return (
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-gold-text size-4 shrink-0" aria-hidden />
            <h2 className="text-base font-semibold">Pro — lifetime</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The full Core question bank and all four fixed mock exams are unlocked on this
            account. Paid once; it does not expire and never renews.
          </p>
          <SupportLink showAim={false} topic="Receipt for my Pro purchase" />
        </CardContent>
      </Card>
    )
  }

  const ended =
    entitlement.status === 'refunded'
      ? 'Your purchase was refunded, so the paid questions are locked again. Everything free stays yours.'
      : entitlement.status === 'revoked'
        ? 'Pro access on this account has been withdrawn. If that looks wrong, say so and it will be looked at.'
        : null

  return (
    <Card>
      <CardContent className="space-y-3">
        <h2 className="text-base font-semibold">{ended ? 'Pro' : 'Free'}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {ended ??
            'You have the free Core sample — 150 questions with full explanations, and every timed format. Pro adds the rest of the bank and the four fixed mock exams.'}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="/pricing" size="sm">
            {ended ? 'See Pro again' : `See what Pro adds — ${formatPrice()}`}
          </ButtonLink>
          {ended ? <SupportLink showAim={false} topic="Question about my access" /> : null}
        </div>
      </CardContent>
    </Card>
  )
}

/* ----------------------------------------------------------------- progress */

function ProgressSection() {
  const progress = useProgress()
  const ready = useProgressReady()
  const { reset } = useProgressActions()
  const [confirming, setConfirming] = useState(false)

  // Derived, never stored — the same rule the rest of the product follows, so
  // these can never disagree with the section pages.
  const attempts = progress.attempts.length
  const correct = progress.attempts.filter((a) => a.correct).length
  const sessions = progress.sessions.length

  return (
    <Panel title="Your progress" bodyClassName="gap-4 p-5">
        {!ready ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : attempts === 0 ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Nothing recorded yet. Answer a question anywhere and it will show up here.
          </p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-3">
            <Stat label="Questions answered" value={String(attempts)} />
            <Stat
              label="Correct"
              value={`${Math.round((correct / attempts) * 100)}%`}
            />
            <Stat label="Timed sittings" value={String(sessions)} />
          </dl>
        )}

        <div className="border-border border-t pt-4">
          {confirming ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed">
                This erases every answer, every result and every mock in progress, on this device.
                It cannot be undone.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    reset()
                    setConfirming(false)
                  }}
                >
                  Yes, erase my progress
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                  Keep it
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={!ready || attempts + sessions === 0}
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="size-4" aria-hidden />
              Erase my progress
            </Button>
          )}
        </div>
    </Panel>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-muted/40 rounded-2xl border p-4">
      <dt className="text-muted-foreground text-xs leading-relaxed">{label}</dt>
      <dd className="mt-1.5 text-2xl leading-none font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

/* --------------------------------------------------------------------- data */

function DataSection({ signedIn }: { signedIn: boolean }) {
  return (
    <Panel title="Your data" bodyClassName="gap-3 p-5">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {signedIn
            ? 'Your answers are kept in this browser and copied to your account. Nothing else about you is stored.'
            : 'Your answers are kept in this browser and nowhere else.'}
        </p>
        <nav aria-label="Policies" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {[
            { href: '/privacy', label: 'What we store' },
            { href: '/terms', label: 'Terms' },
            { href: '/refunds', label: 'Refunds' },
            { href: '/contact', label: 'Contact' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              {l.label}
            </Link>
          ))}
        </nav>
    </Panel>
  )
}
