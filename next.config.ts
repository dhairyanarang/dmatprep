import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The practice hub became /test when the navigation collapsed to five
  // destinations. The runners underneath keep their URLs.
  async redirects() {
    return [
      { source: '/practice', destination: '/test', permanent: false },
      // Review is not part of the public beta. The data model and components
      // remain; the destination does not, so any saved link lands on Home
      // rather than a 404.
      { source: '/review', destination: '/', permanent: false },
      // The study plan was removed as a product feature. A bookmark to it
      // lands on Prepare, which is where its one real job — deciding what to
      // do next — now lives.
      { source: '/study-plan', destination: '/prepare', permanent: false },
      // The refund policy is a section of the Terms now, and "About this
      // resource" was internal detail rather than something a candidate needs.
      // Both had public URLs, so both land somewhere real.
      { source: '/refunds', destination: '/terms', permanent: false },
      { source: '/about', destination: '/information', permanent: false },
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
   * With COMMERCE_ENABLED unset — which is every production build — this list
   * is empty, no rewrite exists, and `/solutions/*.json` is served from
   * `public/` exactly as it always has been.
   */
  async rewrites() {
    if (process.env.COMMERCE_ENABLED !== '1') return []
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
