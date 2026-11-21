'use client'

import { useState, useSyncExternalStore } from 'react'

/**
 * Two celebratory bursts, from the bottom corners.
 *
 * This replaced two narrow columns down the left and right edges. Those were
 * restrained to the point of reading as an accident — a strip of falling dots
 * at each margin rather than a celebration. A burst says the thing: it has an
 * origin, a direction and a moment.
 *
 * Each particle leaves its corner on a diagonal heading up and inwards, so the
 * two bursts meet across the middle of the screen. Travel is fast out of the
 * corner and slow at the end, with a little downward drift in the last stretch
 * so the paper falls rather than freezing mid-air.
 *
 * **It renders behind the card, not over it.** The confetti sits at `z-0` and
 * the success card at `z-10`, which is what lets the particles cross the centre
 * of the screen while the heading, the account it is active on and the two
 * buttons stay completely unobscured. Readability is a layering decision here,
 * not a matter of keeping the effect small.
 *
 * No dependency. A confetti library is some tens of kilobytes to animate forty
 * divs for a second and a half, on a page almost nobody sees twice.
 *
 * It fires once per mount and never on a re-render: the particles are built in
 * a lazy `useState` initialiser, so React re-rendering this component — and it
 * will, as the entitlement store notifies — cannot restart the animation.
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
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.key}
          className="absolute block"
          style={
            {
              left: piece.side === 'left' ? 0 : undefined,
              right: piece.side === 'right' ? 0 : undefined,
              bottom: 0,
              width: piece.width,
              height: piece.height,
              background: piece.colour,
              borderRadius: piece.round ? '50%' : '1px',
              opacity: 0,
              // The travel vector, handed to one shared keyframe. `--dx` is
              // signed per side so a single animation serves both bursts.
              '--dx': `${piece.dx}px`,
              '--dy': `${piece.dy}px`,
              '--drop': `${piece.drop}px`,
              '--rot': `${piece.rot}deg`,
              animation: `confetti-burst ${piece.duration}ms cubic-bezier(.16,.72,.28,1) ${piece.delay}ms 1 both`,
            } as React.CSSProperties
          }
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

type Piece = {
  key: string
  side: 'left' | 'right'
  width: number
  height: number
  colour: string
  round: boolean
  dx: number
  dy: number
  drop: number
  rot: number
  duration: number
  delay: number
}

/**
 * The two bursts, in the product's own colours.
 *
 * Gold leads because this is a membership moment and gold is what membership
 * means here; blue and ink keep it from reading as a single-colour shower.
 *
 * Angles run from 22° to 78° above the horizontal, measured out of the corner,
 * so the spray is a fan rather than a line and nothing travels straight up the
 * edge the way the old columns did. Reach is expressed in viewport units at
 * build time, which is what carries a burst across the middle of a laptop
 * screen and keeps it proportionate on a phone.
 */
function makePieces(): Piece[] {
  const colours = ['var(--gold)', 'var(--gold-strong)', 'var(--brand)', 'var(--foreground)']
  const perSide = 34

  const vw = typeof window === 'undefined' ? 1280 : window.innerWidth
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight
  // Far enough that the two fans genuinely meet across the middle, with a
  // floor for phones and a ceiling so a wide monitor does not fire paper off
  // the opposite edge. Measured rather than guessed: at 0.62 of the width and
  // an 860px cap, not one particle on a 1440px screen reached the centre, and
  // the effect read as two corner huddles instead of two bursts.
  const reach = Math.min(Math.max(vw * 0.78, 420), 1100)

  const out: Piece[] = []
  for (const side of ['left', 'right'] as const) {
    for (let i = 0; i < perSide; i++) {
      // Spread the fan evenly and then jitter, so the angles cover the whole
      // arc instead of clumping wherever Math.random happened to land.
      const spread = (i + Math.random() * 0.8) / perSide
      const angle = ((22 + spread * 56) * Math.PI) / 180
      // A wide spread of distances, so each burst keeps a tail of paper near
      // its corner while its leading edge is already across the middle. With
      // a narrow spread every particle left together and the corners sat
      // empty — which looked like scatter, not like something thrown.
      const distance = reach * (0.18 + Math.random() * 0.82)

      const dx = Math.cos(angle) * distance * (side === 'left' ? 1 : -1)
      const dy = -Math.min(Math.sin(angle) * distance, vh * 0.92)

      out.push({
        key: `${side}-${i}`,
        side,
        width: Math.round(5 + Math.random() * 6),
        height: Math.round(8 + Math.random() * 7),
        colour: colours[i % colours.length],
        // A few discs among the rectangles reads as paper rather than pixels.
        round: i % 7 === 0,
        dx: Math.round(dx),
        dy: Math.round(dy),
        // Gravity, applied only over the final stretch of the keyframe.
        drop: Math.round(40 + Math.random() * 110),
        rot: Math.round((Math.random() * 2 - 1) * 540),
        duration: Math.round(1150 + Math.random() * 600),
        // Tight, so the two bursts read as one event rather than a trickle.
        delay: Math.round(Math.random() * 240),
      })
    }
  }
  return out
}
