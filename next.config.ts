import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The practice hub became /test when the navigation collapsed to five
  // destinations. The runners underneath keep their URLs.
  async redirects() {
    return [{ source: '/practice', destination: '/test', permanent: false }]
  },
  turbopack: {
    // The project lives under ~/Desktop, and a stray package-lock.json in the home
    // directory makes Turbopack infer ~/ as the workspace root. Pin it here.
    root: path.resolve(import.meta.dirname),
  },
}

export default nextConfig
