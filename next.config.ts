import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The practice hub became /test when the navigation collapsed to five
  // destinations. The runners underneath keep their URLs.
  async redirects() {
    return [
      { source: '/practice', destination: '/test', permanent: false },
      // Review is not part of the public beta. The data model and components
      // remain; the destination does not, so any saved link lands on the
      // dashboard rather than a 404. It pointed at '/' until `/` became the
      // public landing page — a saved link from inside the product should come
      // back inside the product, not to a marketing page.
      { source: '/review', destination: '/dashboard', permanent: false },
      // The study plan was removed as a product feature. A bookmark to it
      // lands on Prepare, which is where its one real job — deciding what to
      // do next — now lives.
      { source: '/study-plan', destination: '/prepare', permanent: false },
      // The refund policy is a section of the Terms now, so a saved link
      // lands somewhere real.
      { source: '/refunds', destination: '/terms', permanent: false },
      // `/about` redirected to /information while there was no About page.
      // There is one now — who built this, how the questions are verified and
      // what the tool does not claim — which is what someone typing /about is
      // looking for. /information remains, as the index of the policy pages.
    ]
  },
  /**
   * Pilot-only: withhold premium solutions from the public path.
   *
   * `beforeFiles` rewrites are matched BEFORE the `public/` directory is
   * consulted (Next's documented routing order, step 4 against step 5), which
   * is the only way to stop a committed static file being served without
   * deleting or rewriting it.
   *
   * The gate is `PILOT_SOLUTIONS`, set only by `scripts/dev-pilot.mjs`. It was
   * `COMMERCE_ENABLED`, on the premise that production would never turn commerce
   * on. Launch falsified that premise: the rewrite activated in production and
   * sent every solution request to a handler that reads `.pilot/`, which is
   * git-ignored and never built on Vercel. Every practice screen reported that
   * answers could not be loaded, for free and paid users alike, because the free
   * half is a hard dependency of the marking gate.
   *
   * Production needs no rewrite and never did. `prebuild` runs
   * `scripts/build-solutions.mjs`, which already writes the free 150 — and only
   * those — into `public/solutions/` whenever COMMERCE_ENABLED=1. Two independent
   * mechanisms exist; this one belongs to the pilot, and shadowing the other in
   * production is what broke it.
   */
  async rewrites() {
    if (process.env.PILOT_SOLUTIONS !== '1') return []
    return {
      beforeFiles: [
        {
          // `:section.json` does NOT work: the parameter swallows the
          // extension, so the handler was asked for "figure-sequences.json"
          // and refused it as an unknown section. The whole segment is
          // captured instead and the extension stripped server-side — found by
          // actually calling the URL, which the structural tests could not do.
          source: '/solutions/:section',
          destination: '/api/content/free-solutions/:section',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
  turbopack: {
    // The project lives under ~/Desktop, and a stray package-lock.json in the home
    // directory makes Turbopack infer ~/ as the workspace root. Pin it here.
    root: path.resolve(import.meta.dirname),
  },
}

export default nextConfig
