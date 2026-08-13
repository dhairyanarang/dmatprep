'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/supabase/env'
import type { Database } from '@/lib/supabase/types'

export type DmatSupabaseClient = SupabaseClient<Database>

let client: DmatSupabaseClient | null = null

/**
 * The browser client, created once and reused.
 *
 * `createBrowserClient` keeps the session in cookies rather than localStorage,
 * which is what lets the OAuth callback — a server route — complete the code
 * exchange for a session the browser then already holds.
 *
 * Returns null when Supabase is not configured. Every caller has to handle that
 * anyway, because guest mode is a supported way to use the product rather than
 * a degraded one.
 */
export function getSupabaseBrowserClient(): DmatSupabaseClient | null {
  if (!isSupabaseConfigured) return null
  client ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  return client
}
