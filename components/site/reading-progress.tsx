'use client'

import { useEffect, useRef } from 'react'

/**
 * A hairline progress bar across the top of a long guide.
 *
 * Written against the DOM rather than React state on purpose. A scroll handler
 * that calls `setState` re-renders the tree on every frame of a scroll, which
 * is a real cost for a decorative two-pixel rule; writing the width straight
 * onto the element costs nothing and is what the browser does well.
 *
 * It renders nothing at all under `prefers-reduced-motion`, which is the
 * honest reading of that preference here: the bar's entire content is motion.
 * The guide loses no information without it.
 */
export function ReadingProgress() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const el = ref.current
    if (!el) return
    el.style.opacity = '1'

    let frame = 0
    const update = () => {
      frame = 0
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      const ratio = scrollable > 0 ? doc.scrollTop / scrollable : 0
      el.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`
    }
    const onScroll = () => {
      // One update per animation frame, however often the event fires.
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-14 z-30 h-px">
      <div
        ref={ref}
        className="bg-brand h-px origin-left opacity-0"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
