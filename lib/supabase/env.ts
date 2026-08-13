/**
 * Supabase is optional infrastructure, not a dependency of the product.
 *
 * dMAT Prep works fully as a guest: every route is static, every question is in
 * the bundle, and progress lives in `localStorage`. Signing in adds durability
 * across devices and nothing else. So the whole cloud layer is behind this
 * check, and when the variables are absent the app never renders a sign-in
 * affordance, never opens a client, and never attempts a request.
 *
 * The reads are written out literally because Next.js inlines `NEXT_PUBLIC_*`
 * at build time by matching the source text — a computed lookup would resolve
 * to `undefined` in the browser.
 */

/** Current Supabase naming; the legacy anon key is accepted as a fallback. */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

/**
 * Whether the cloud layer is available at all.
 *
 * Both values are publishable by design — the publishable key is safe in the
 * browser precisely because row level security, not key secrecy, is what keeps
 * one candidate's attempts away from another's. The service-role key is never
 * read anywhere in this codebase.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
