import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // next-themes writes the class before paint; React must not object to it.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
        </ThemeProvider>
      </body>
    </html>
  )
}
