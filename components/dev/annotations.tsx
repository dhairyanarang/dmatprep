'use client'

import dynamic from 'next/dynamic'

/**
 * Agentation visual feedback toolbar — development only.
 *
 * The import sits inside a branch the compiler can prove false in production
 * (`process.env.NODE_ENV` is inlined at build time), so the library and its
 * stylesheet are dropped from the production graph entirely.
 *
 * A plain static import with a render-time guard is not enough: the package
 * has CSS side effects, so the bundler cannot tree-shake it and all ~500KB
 * ships to production even though the component never renders.
 */
const Toolbar =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('agentation').then((m) => m.Agentation), { ssr: false })
    : null

export function DevAnnotations() {
  if (!Toolbar) return null
  return <Toolbar />
}
