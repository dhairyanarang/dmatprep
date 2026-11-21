'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { ArrowRight, Coffee, Check } from 'lucide-react'

import { GamPackRunner } from '@/components/gam/pack-runner'
import { PageContainer } from '@/components/layout/page-shell'
import { TimedLauncher, type StageSpec } from '@/components/practice/timed-launcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { PublicGamPackFile } from '@/lib/gam/registry'

type Module = 'core' | 'break' | 'gam'

const STORAGE_KEY = 'dmat:full-mock:module'

/* ------------------------------------------------- where the candidate is up to
 *
 * Read through `useSyncExternalStore` rather than set from an effect. Reading
 * `localStorage` during render is a hydration mismatch, and the obvious fix —
 * read it in an effect and call setState — is a cascading render the React
 * Compiler lint rejects outright (`react-hooks/set-state-in-effect`). The store
 * pattern is what the rest of this codebase already uses for exactly this shape;
 * see `components/payments/edge-confetti.tsx`.
 *
 * The snapshot is a plain string, so returning a fresh read on every call is
 * safe: React compares snapshots with `Object.is`, and equal strings compare
 * equal. The server snapshot is always `core`, which is both the common case and
 * what the markup is prerendered as, so there is no flash on hydration.
 */
const listeners = new Set<() => void>()

function subscribeModule(listener: () => void) {
  listeners.add(listener)
  // Another tab moving on should move this one too; a three-hour sitting is
  // long enough that a second tab is a real thing to do.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function moduleSnapshot(): Module {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'break' || saved === 'gam' ? saved : 'core'
  } catch {
    // A private window or blocked site data. Starting at the Core module is the
    // correct fallback, so there is nothing else to do.
    return 'core'
  }
}

/** Always the Core module on the server, and until hydration. */
const serverModuleSnapshot = (): Module => 'core'

function writeModule(next: Module) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Not being able to remember the position is a degraded experience, not a
    // broken one — the sitting still runs, it just restarts at the Core module.
  }
  for (const listener of listeners) listener()
}

/**
 * The full sitting: Core Module, a break, then the General Academic Module.
 *
 * The two halves are run by the two runners that already exist, unchanged. That
 * is the whole design. Module A is standalone questions marked as they are
 * answered; Module B is source packs marked in one go on submission. Forcing one
 * runner to do both would have meant a single component holding two question
 * models, two storage shapes and two marking paths — a large change to the most
 * safety-critical screen in the product, to express something the real
 * examination expresses as two sittings with a break between them.
 *
 * So this component owns exactly one piece of state: which module the candidate
 * is on. Everything else belongs to the runner currently on screen, including
 * its own resume behaviour — a Core stage interrupted mid-way is still restored
 * by the Core launcher, and a GAM session by the GAM runner.
 *
 * **The position is remembered across reloads**, because losing it would send a
 * candidate who refreshed during the break back to the start of a three-hour
 * test. It is read in an effect rather than during render: `localStorage` is not
 * available on the server, and reading it during render is the hydration
 * mismatch this codebase has a standing rule against.
 */
export function FullMockSitting({
  coreStages,
  gamPacks,
  coreMinutesPerStage,
  gamMinutes,
  breakMinutes,
  coreSize,
}: {
  coreStages: StageSpec[]
  gamPacks: PublicGamPackFile[]
  coreMinutesPerStage: number
  gamMinutes: number
  breakMinutes: number
  coreSize: number
}) {
  // Named `current`, not `module`: Next's lint reserves the identifier `module`.
  const current = useSyncExternalStore(subscribeModule, moduleSnapshot, serverModuleSnapshot)
  const go = useCallback((next: Module) => writeModule(next), [])

  if (current === 'core') {
    return (
      <>
        <TimedLauncher
          mode="simulation"
          title="Full dMAT mock — Core Module"
          note={`${coreSize} questions in three subtests of ${coreMinutesPerStage} minutes, in the order the real test uses. The General Academic Module follows after a ${breakMinutes}-minute break.`}
          minutesPerStage={coreMinutesPerStage}
          stages={coreStages}
        />
        <PageContainer className="pb-10">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <p className="text-muted-foreground max-w-prose text-sm leading-6">
                Finished the three Core subtests? The real sitting breaks for{' '}
                {breakMinutes} minutes before the General Academic Module.
              </p>
              <Button onClick={() => go('break')}>
                Go to the break
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </>
    )
  }

  if (current === 'break') {
    return (
      <PageContainer className="py-10">
        <Card>
          <CardContent className="flex flex-col items-start gap-5 p-6">
            <span className="bg-frame grid size-11 place-items-center rounded-xl">
              <Coffee className="size-5" aria-hidden />
            </span>
            <div className="space-y-2">
              <h2 className="text-xl tracking-tight">The {breakMinutes}-minute break</h2>
              <p className="text-muted-foreground max-w-prose text-sm leading-6">
                The official material describes the test as about three hours with a break of{' '}
                {breakMinutes} minutes. Nothing here is timing that break — take it properly and come
                back, or carry straight on if you are only practising the second half.
              </p>
              <p className="text-muted-foreground max-w-prose text-sm leading-6">
                The General Academic Module that follows runs for {gamMinutes} minutes in one block.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => go('gam')}>
                Start the General Academic Module
                <ArrowRight className="size-4" aria-hidden />
              </Button>
              <Button variant="outline" onClick={() => go('core')}>
                Back to the Core Module
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <>
      <GamPackRunner
        files={gamPacks}
        mode="timed"
        minutes={gamMinutes}
        storageKey="gam:full-mock"
      />
      <PageContainer className="pb-10">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Check className="size-4" aria-hidden />
              This is the second and final module of the sitting.
            </p>
            <Button variant="outline" onClick={() => go('core')}>
              Back to the Core Module
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  )
}
