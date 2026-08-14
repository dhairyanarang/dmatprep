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

export const metadata: Metadata = {
  title: {
    default: 'dMAT Prep',
    template: '%s · dMAT Prep',
  },
  description:
    'Preparation hub for the dMAT Core Module: reference material, study plan and practice questions.',
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
