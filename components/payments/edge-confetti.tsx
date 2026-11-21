'use client'

import { useState, useSyncExternalStore } from 'react'

/**
 * A restrained confetti burst down the left and right edges.
 *
 * Deliberately not a full-screen celebration: this marks a purchase on a page
 * someone is reading, not a game they have won. Two narrow columns at the
 * margins, a couple of seconds, then gone.
 *
 * No dependency. A confetti library is some tens of kilobytes to animate
 * forty divs for two seconds, and it would be in the bundle of a page almost
 * nobody sees twice.
 *
 * It fires once per mount and never on a re-render: the pieces are generated
 * in a lazy `useState` initialiser, so React re-rendering this component — and
 * it will, as the entitlement store notifies — cannot restart the animation.
 *
 * Nothing renders at all under `prefers-reduced-motion`. The success screen
 * says everything this does; the motion is decoration on top of it.
 */
export function EdgeConfetti() {
  // Read through the store rather than set in an effect: setting state from an
  // effect body causes a second render, and the first one would have already
  // painted the confetti before the preference was known.
  const reduced = useSyncExternalStore(subscribeMotion, motionSnapshot, () => true)

  // Generated once, on first render, and never regenerated — so a re-render
  // from the entitlement store cannot restart the animation.
  const [pieces] = useState(() => makePieces())

  if (reduced) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.key}
          className="absolute block rounded-[1px]"
          style={{
            [piece.side]: `${piece.inset}px`,
            top: '-16px',
            width: piece.width,
            height: piece.height,
            background: piece.colour,
            opacity: 0,
            animation: `confetti-fall ${piece.duration}ms cubic-bezier(.25,.6,.4,1) ${piece.delay}ms 1 both`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

const MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeMotion(listener: () => void) {
  const query = window.matchMedia(MOTION_QUERY)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

/** True on the server and until hydration, so nothing animates unasked. */
function motionSnapshot() {
  return window.matchMedia(MOTION_QUERY).matches
}

/**
 * The pieces, in the product's own colours.
 *
 * Gold leads because this is a membership moment and gold is what membership
 * means here; blue and ink keep it from reading as a single-colour shower.
 */
function makePieces() {
  const colours = ['var(--gold)', 'var(--gold-strong)', 'var(--brand)', 'var(--foreground)']
  const perSide = 14
  const out: {
    key: string
    side: 'left' | 'right'
    inset: number
    width: number
    height: number
    colour: string
    duration: number
    delay: number
  }[] = []

  for (const side of ['left', 'right'] as const) {
    for (let i = 0; i < perSide; i++) {
      out.push({
        key: `${side}-${i}`,
        side,
        // Within ~90px of the edge, so the middle of the page stays clear.
        inset: Math.round(6 + Math.random() * 84),
        width: Math.round(5 + Math.random() * 4),
        height: Math.round(9 + Math.random() * 6),
        colour: colours[i % colours.length],
        duration: Math.round(1900 + Math.random() * 900),
        delay: Math.round(Math.random() * 700),
      })
    }
  }
  return out
}
