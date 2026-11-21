import { notFound } from 'next/navigation'

import { CheckoutView } from '@/components/payments/checkout-view'
import { getCoreMocks, mockSize } from '@/lib/content/mocks'
import { getBankSize } from '@/lib/content/registry'
import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { SECTION_IDS } from '@/lib/sections'

export const metadata = { title: 'Checkout' }

/**
 * Checkout, on its own page and outside the app shell.
 *
 * It is deliberately NOT a form. Razorpay's own window collects the card, the
 * UPI id and everything else, which is the entire reason we never see them —
 * so a payment-method chooser here would be decoration over a decision made
 * somewhere else. What this page owes the buyer is the three things it can
 * actually answer: what they get, what it costs, and what happens next.
 *
 * With nothing for sale it is not a page at all. A checkout that cannot charge
 * anything is the definition of a dead end.
 */
export default function CheckoutPage() {
  if (!COMMERCE_ENABLED) notFound()

  const bankSize = SECTION_IDS.reduce((n, id) => n + getBankSize(id), 0)
  const mocks = getCoreMocks()

  return (
    <CheckoutView
      bankSize={bankSize}
      mockCount={mocks.length}
      mockSize={mocks[0] ? mockSize(mocks[0]) : 0}
    />
  )
}
