import type { Metadata } from 'next'
import { JetBrains_Mono, Manrope } from 'next/font/google'

import { Clarity } from '@/components/analytics/clarity'
import { AuthNotice } from '@/components/auth/auth-notice'
import { SyncProvider } from '@/components/auth/sync-provider'
import { DevAnnotations } from '@/components/dev/annotations'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { TopBar } from '@/components/layout/top-bar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

// Manrope is the product face in the design, which uses 400/500/600. Loading it
// as a variable font gives those exact weights rather than the nearest static cut.
const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
})

// Stands in for Berkeley Mono, which is commercial. Reserved for equations,
// grid letters and IDs — never headings or body copy.
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
})

const SITE_URL = 'https://dmatprep.vercel.app'
const TITLE = 'dMAT Prep — Prepare smarter for the dMAT'
const DESCRIPTION =
  'An independent preparation tool to help candidates learn, practise and simulate the dMAT.'

/**
 * All site metadata lives here and nowhere else.
 *
 * The icon, Apple touch icon and Open Graph image are supplied by the App
 * Router's file conventions — `icon.png`, `apple-icon.png` and
 * `opengraph-image.jpeg` beside this file. That is deliberate: those files are
 * their own source of truth, so Next emits the tags with correct absolute URLs,
 * dimensions and content types, and there is no second declaration here to
 * contradict them. Adding `openGraph.images` as well would produce exactly the
 * duplicate og:image this is written to avoid.
 *
 * `metadataBase` is what turns the relative asset paths into the absolute URLs
 * that WhatsApp, LinkedIn and Facebook require — without it they resolve
 * against nothing and the preview silently comes back blank.
 *
 * The wording is careful and stays that way: dMAT Prep is independent, and
 * nothing here may imply it is official, endorsed or approved, or that its
 * questions are real examination material.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · dMAT Prep',
  },
  description: DESCRIPTION,
  applicationName: 'dMAT Prep',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'dMAT Prep',
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_GB',
  },
  twitter: {
    // No `images` entry: X falls back to the Open Graph image, so the 429KB
    // asset is served once rather than declared twice.
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <div className="flex min-h-svh">
            <AppSidebar />

            <div className="flex min-w-0 flex-1 flex-col">
              <MobileNav />
              <TopBar />
              <AuthNotice />
              <main className="flex-1">{children}</main>
            </div>
          </div>
          <Toaster />
          {/* Moves progress between this browser and the cloud. Renders nothing,
              and does nothing at all for a guest. */}
          <SyncProvider />
        </TooltipProvider>

        {/* Visual feedback toolbar; dev-only, and dropped from production builds. */}
        <DevAnnotations />

        {/* Behavioural analytics. Renders nothing outside a production
            deployment, and never identifies anyone. */}
        <Clarity />
      </body>
    </html>
  )
}
