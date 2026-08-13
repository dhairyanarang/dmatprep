import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Where Google sends the candidate back to.
 *
 * The browser started the PKCE flow and holds the verifier in a cookie; this
 * handler trades the returned code for a session and writes the auth cookies,
 * so by the time the redirect lands the client is already signed in.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Only ever redirect within this app: an absolute `next` would turn the
  // callback into an open redirect.
  const requested = searchParams.get('next') ?? '/'
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/'

  if (code) {
    const supabase = await createSupabaseServerClient()
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        const forwardedHost = request.headers.get('x-forwarded-host')
        const base =
          process.env.NODE_ENV === 'development' || !forwardedHost
            ? origin
            : `https://${forwardedHost}`
        // `signed-in` is what tells the client to run the guest → cloud merge
        // once, rather than on every page load.
        return NextResponse.redirect(`${base}${next}${next.includes('?') ? '&' : '?'}signed-in=1`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/?auth-error=1`)
}
