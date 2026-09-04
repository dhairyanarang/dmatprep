import { GamPackRunner } from '@/components/gam/pack-runner'
import { GAM_TOTAL_MINUTES, getPacks } from '@/lib/gam/registry'

export const metadata = { title: 'Timed session — Module B' }

/**
 * OFFICIAL (GAM PDF p. 34): the subject module runs 90 minutes in total.
 *
 * PRODUCT BEHAVIOUR, not official: which packs a session contains, that it runs
 * them in one continuous block, and that a session can be resumed. The official
 * material does not say how many source packs a sitting contains, so the pilot
 * runs the ones that exist and the clock is the only part taken from the source.
 */
export default function GamTimedPage() {
  return (
    <GamPackRunner
      files={getPacks()}
      mode="timed"
      minutes={GAM_TOTAL_MINUTES}
      storageKey="gam:timed"
    />
  )
}
