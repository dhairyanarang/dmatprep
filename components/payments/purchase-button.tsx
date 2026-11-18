'use client'

import { useCallback, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { GoogleButton } from '@/components/auth/google-button'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/use-auth'
import { COMMERCE_ENABLED, formatPrice } from '@/lib/payments/config'
import { invalidateEntitlement, useEntitlement } from '@/lib/payments/use-entitlement'

/**
 * The purchase flow, as one button and five honest states.
 *
 * Three things it refuses to do:
 *
 *  · It never decides entitlement. It asks the server to create an order and
 *    asks the server to verify the result. Nothing here grants anything.
 *  · It never sends an amount. The price is server configuration, so a modified
 *    client cannot ask to pay less.
 *  · It never reports success on the strength of Razorpay's callback alone. The
 *    callback is passed to `/api/checkout/verify`, which re-verifies the
 *    signature against the order id WE stored and asks Razorpay what actually
 *    happened before anything is granted.
 *
 * `pending` is a real outcome and not an error. A captured payment whose
 * confirmation has not arrived yet is normal; the webhook or the reconciliation
 * sweep finishes it, and saying "we are waiting" is better than either a false
 * success or a false failure.
 */

type Phase = 'idle' | 'working' | 'success' | 'pending' | 'error'

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  handler: (response: Record<string, string>) => void
  modal?: { ondismiss?: () => void }
  theme?: { color?: string }
}

type RazorpayCtor = new (options: RazorpayOptions) => { open: () => void }

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

function loadCheckout(): Promise<RazorpayCtor | null> {
  const existing = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.async = true
    script.onload = () => resolve((window as unknown as { Razorpay?: RazorpayCtor }).Razorpay ?? null)
    script.onerror = () => resolve(null)
    document.head.append(script)
  })
}

export function PurchaseButton({ className }: { className?: string }) {
  const auth = useAuth()
  const entitlement = useEntitlement()
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const start = useCallback(async () => {
    setPhase('working')
    setMessage(null)
    try {
      const orderResponse = await fetch('/api/checkout/order', { method: 'POST' })
      if (!orderResponse.ok) {
        const body = (await orderResponse.json().catch(() => ({}))) as { error?: string }
        if (body.error === 'already-entitled') {
          invalidateEntitlement()
          setPhase('success')
          return
        }
        throw new Error(body.error ?? 'Could not start the payment.')
      }
      const order = (await orderResponse.json()) as {
        orderId: string
        amount: number
        currency: string
        keyId: string
      }

      const Razorpay = await loadCheckout()
      if (!Razorpay) throw new Error('The payment window could not be loaded.')

      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'dMAT Prep',
        description: 'Full Core question bank — one-time',
        theme: { color: '#e4f222' },
        modal: {
          // Abandoning checkout is not a failure. No order is captured, no
          // entitlement changes, and the candidate is returned to where they
          // were without an error they have to dismiss.
          ondismiss: () => setPhase('idle'),
        },
        handler: (response) => {
          setPhase('working')
          void fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(response),
          })
            .then(async (verify) => {
              if (verify.ok) {
                invalidateEntitlement()
                setPhase('success')
                return
              }
              const body = (await verify.json().catch(() => ({}))) as {
                error?: string
                pending?: boolean
              }
              if (verify.status === 202 || body.pending) {
                setPhase('pending')
                return
              }
              setMessage(
                'We could not confirm that payment. Nothing has been granted. If money has left your account, contact us and we will sort it out.',
              )
              setPhase('error')
            })
            .catch(() => {
              // The payment may well have succeeded; what failed is our
              // confirmation of it. Say that, rather than implying a loss.
              setPhase('pending')
            })
        },
      })
      checkout.open()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
      setPhase('error')
    }
  }, [])

  if (!COMMERCE_ENABLED) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Everything is free at the moment — all 384 Core questions, with full explanations. There
          is nothing to buy yet, and nothing has been taken away.
        </p>
      </div>
    )
  }

  if (entitlement.ready && entitlement.access) {
    return (
      <div className={className}>
        <p className="text-foreground text-sm font-medium">You have full access.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Every Core question is unlocked on this account.
        </p>
      </div>
    )
  }

  if (auth.status === 'guest' || auth.status === 'unavailable') {
    return (
      <div className={className}>
        <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
          Buying needs an account, because access is attached to one. Free practice does not — and
          anything you have already answered as a guest comes with you when you sign in.
        </p>
        <GoogleButton next="/pricing" label="Sign in to continue" />
      </div>
    )
  }

  return (
    <div className={className}>
      <Button onClick={start} disabled={phase === 'working'} size="lg" className="w-full sm:w-auto">
        {phase === 'working' ? <Loader2 className="size-4 animate-spin" /> : null}
        {phase === 'working' ? 'Working…' : `Unlock everything — ${formatPrice()}`}
      </Button>

      {phase === 'success' ? (
        <p className="text-foreground mt-3 text-sm font-medium">
          Payment confirmed. Every Core question is now unlocked on this account.
        </p>
      ) : null}

      {phase === 'pending' ? (
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Your payment went through and we are waiting for the final confirmation. This usually
          takes a moment. You do not need to pay again — refresh in a minute, and if it still has
          not appeared, contact us.
        </p>
      ) : null}

      {phase === 'error' && message ? (
        <p className="text-destructive mt-3 text-sm leading-relaxed">{message}</p>
      ) : null}

      <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
        One-time payment. No subscription, and nothing is charged again.
      </p>
    </div>
  )
}
