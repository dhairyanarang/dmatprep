import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/supabase/env'
import type { Database } from '@/lib/supabase/types'

/**
 * The server client, used by exactly two route handlers: the OAuth callback and
 * sign-out. Nothing else on the server touches Supabase.
 *
 * That is deliberate. Every page in dMAT Prep is statically rendered and reads
 * its data on the client, so there is no request-time user to fetch and no
 * reason to make a static route dynamic. It also means the app needs no proxy
 * (`proxy.ts`) to refresh sessions — the browser client refreshes its own
 * tokens and writes them back to the same cookies these handlers read.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database> | null> {
  if (!isSupabaseConfigured) return null

  const cookieStore = await cookies()

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. Safe to
          // ignore: the only writers here are route handlers.
        }
      },
    },
  })
}
