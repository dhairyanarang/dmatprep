import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

import { DevAnnotations } from '@/components/dev/annotations'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

// Inter as a variable font: the system uses 400/510/590, which needs the full
// axis rather than the discrete weights a static family would give.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  axes: ['opsz'],
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <div className="flex min-h-svh">
            <AppSidebar />

            <div className="flex min-w-0 flex-1 flex-col">
              <MobileNav />
              <main className="flex-1">{children}</main>
            </div>
          </div>
          <Toaster />
        </TooltipProvider>

        {/* Visual feedback toolbar; dev-only, and dropped from production builds. */}
        <DevAnnotations />
      </body>
    </html>
  )
}
