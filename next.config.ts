import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    // The project lives under ~/Desktop, and a stray package-lock.json in the home
    // directory makes Turbopack infer ~/ as the workspace root. Pin it here.
    root: path.resolve(import.meta.dirname),
  },
}

export default nextConfig
