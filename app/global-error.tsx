'use client'

import './globals.css'

import { SupportEmail } from '@/components/support/support-link'

/**
 * The last line of defence.
 *
 * `global-error.tsx` replaces the root layout entirely, so there is no sidebar,
 * no footer and — importantly — no independence statement. That is why
 * `_global-error.html` is the one page the release check exempts from the
 * disclaimer sweep, and why the short form is repeated inline here: a page that
 * cannot inherit the footer still should not be the one page that implies
 * nothing about who we are.
 *
 * It also has to render its own `html` and `body`. Everything here is
 * deliberately self-contained: no providers are mounted at this point, so this
 * must not reach for the progress store, the solutions hook or anything else
 * that assumes context.
 *
 * Next's default said "A server error occurred. Reload to try again." and gave
 * no way to get help. For a product that will take payments, the screen shown
 * when something is badly wrong is the one that most needs a route out.
 *
 * Note on the build output: `.next/server/app/_global-error.html` stays as
 * Next's own static shell and does NOT contain this component. That is the
 * framework's fallback for the case where the boundary itself cannot render;
 * this component is what actually runs when a client error is caught. So the
 * release check's exemption for that one file remains correct.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  // Next 16 names this `retry`, not `reset` — verified against
  // node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md.
  // The older name silently produces a button wired to undefined.
  retry: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16">
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Something went wrong
            </p>
            <h1 className="text-2xl font-medium tracking-tight">This page didn’t load</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The error is at our end, not yours.{' '}
              <strong className="text-foreground">Your progress is safe</strong> — answers are
              saved in this browser as you give them, and nothing is lost by reloading.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => retry()}
              className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium"
            >
              Try again
            </button>
            {/*
              A plain anchor, deliberately. `next/link` navigates through the
              client router, and this boundary renders precisely when something
              in the React tree has failed — the router may be part of what
              broke. A full page load is the one navigation that cannot depend
              on the thing that just threw.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="border-border rounded-md border px-4 py-2 text-sm font-medium"
            >
              Go to the home page
            </a>
          </div>

          <div className="text-muted-foreground space-y-2 text-xs leading-relaxed">
            <p>
              If it keeps happening, write to{' '}
              <SupportEmail topic="A page kept failing to load" />
              {error.digest ? (
                <>
                  {' '}
                  and quote <code className="font-mono">{error.digest}</code>, which identifies
                  this particular failure in our logs.
                </>
              ) : (
                '.'
              )}
            </p>
            <p className="border-border border-t pt-3">
              dMAT Prep is an independent preparation resource. It is not affiliated with,
              endorsed by, or sponsored by g.a.s.t. or APS India.
            </p>
          </div>
        </main>
      </body>
    </html>
  )
}
