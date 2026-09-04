import { Info } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getPacks, readinessOf } from '@/lib/gam/registry'

/**
 * What the candidate is actually looking at.
 *
 * The packs have cleared automated validation, the pack-level leakage gate and
 * independent adjudication. None has been signed off by a person. Saying so is
 * not a disclaimer to bury — it is the difference between the three gates, and
 * the interface is the last place it could be blurred.
 */
export function GamPilotNotice() {
  const packs = getPacks()
  const reviewed = packs.filter(({ pack }) => readinessOf(pack) === 'reviewed').length

  return (
    <Alert>
      <Info className="size-4" />
      <AlertTitle>Pilot content</AlertTitle>
      <AlertDescription>
        {reviewed === packs.length
          ? 'Every pack here has been reviewed by a person.'
          : `These ${packs.length} packs are original material written for this hub. They have passed
             automated validation and an independent adjudication round in which a separate model
             answered every question without the answer key. ${reviewed} of ${packs.length} have been
             signed off by a person. Treat the rest as practice material under review, not as settled
             answers.`}
      </AlertDescription>
    </Alert>
  )
}
