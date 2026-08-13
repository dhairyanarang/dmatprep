#!/usr/bin/env node
/**
 * Row level security, tested against the live project rather than read off the
 * SQL.
 *
 * Two parts:
 *
 *   anon      — with only the publishable key, every user-owned table must
 *               refuse to hand over rows. This runs with no arguments and is
 *               the check that matters most, because the publishable key is
 *               the one that ships to every browser.
 *
 *   two users — give it two access tokens and it proves the harder claim: that
 *               user A cannot read, update, or insert as user B. Tokens are
 *               taken from the browser after signing in, so no password or
 *               service-role key is ever handled here.
 *
 * Usage:
 *   node scripts/verify-rls.mjs
 *   node scripts/verify-rls.mjs <accessTokenA> <accessTokenB>
 *
 * Getting a token: sign in, then in the browser console run
 *   JSON.parse(Object.entries(localStorage).find(([k]) => k.includes('auth-token'))[1]).access_token
 * or read it from the `sb-<ref>-auth-token` cookie.
 */

import { readFileSync } from 'node:fs'

const TABLES = ['profiles', 'attempts', 'sessions', 'question_exposure', 'user_state']

function env() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    try {
      const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
      for (const line of raw.split('\n')) {
        const [k, ...rest] = line.split('=')
        const v = rest.join('=').trim()
        if (k?.trim() === 'NEXT_PUBLIC_SUPABASE_URL') url ??= v
        if (k?.trim() === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') key ??= v
      }
    } catch {
      // fall through to the check below
    }
  }
  if (!url || !key) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.')
    process.exit(1)
  }
  return { url: url.replace(/\/$/, ''), key }
}

const { url, key } = env()

const req = (path, { token = key, method = 'GET', body } = {}) =>
  fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

let failures = 0
const pass = (m) => console.log(`  ✓ ${m}`)
const fail = (m) => {
  failures++
  console.log(`  ✗ ${m}`)
}

async function userIdFor(token) {
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    console.error(`Could not resolve a user for one of the tokens (${res.status}).`)
    process.exit(1)
  }
  return (await res.json()).id
}

async function schemaPresent() {
  const res = await req('attempts?select=id&limit=1')
  if (res.status === 404) {
    const body = await res.json().catch(() => ({}))
    if (body.code === 'PGRST205') {
      console.error(
        '\nThe schema is not applied to this project yet.\n' +
          'Run `supabase db push` (or paste supabase/migrations/*.sql into the SQL editor) first.\n',
      )
      process.exit(2)
    }
  }
}

async function anonChecks() {
  console.log('\nAnonymous (publishable key only)')
  for (const table of TABLES) {
    const res = await req(`${table}?select=*&limit=1`)
    if (res.status === 200) {
      const rows = await res.json()
      // 200 with an empty array is RLS working: the policy matched no rows.
      // 200 with rows would mean the table is readable by anyone.
      if (Array.isArray(rows) && rows.length === 0) pass(`${table}: no rows readable`)
      else fail(`${table}: ANON CAN READ ${rows.length} ROW(S)`)
    } else if (res.status === 401 || res.status === 403) {
      pass(`${table}: refused (${res.status})`)
    } else {
      fail(`${table}: unexpected ${res.status}`)
    }
  }

  const res = await req('attempts', {
    method: 'POST',
    body: {
      id: `rls-anon-${Date.now()}`,
      question_id: 'ls-low-001',
      section: 'latin-squares',
      difficulty: 'low',
      mode: 'practice',
      is_correct: true,
      attempted_at: new Date().toISOString(),
    },
  })
  if (res.ok) fail('attempts: ANON CAN INSERT')
  else pass(`attempts: insert refused (${res.status})`)
}

async function crossUserChecks(tokenA, tokenB) {
  const [idA, idB] = await Promise.all([userIdFor(tokenA), userIdFor(tokenB)])
  if (idA === idB) {
    console.error('\nBoth tokens belong to the same user. Use two different accounts.\n')
    process.exit(1)
  }
  console.log(`\nUser A ${idA}\nUser B ${idB}`)

  // Give B something to hide.
  const marker = `rls-test-${Date.now()}`
  const seeded = await req('attempts', {
    token: tokenB,
    method: 'POST',
    body: {
      id: marker,
      question_id: 'ls-low-001',
      section: 'latin-squares',
      difficulty: 'low',
      mode: 'practice',
      is_correct: true,
      attempted_at: new Date().toISOString(),
    },
  })
  if (!seeded.ok) {
    console.error(`  ! could not seed a row as user B (${seeded.status}) — cannot test isolation`)
    failures++
    return
  }

  console.log('\nCross-user isolation')

  for (const table of TABLES) {
    const owner = table === 'profiles' ? 'id' : 'user_id'
    const res = await req(`${table}?select=*&${owner}=eq.${idB}`, { token: tokenA })
    const rows = res.ok ? await res.json() : []
    if (res.ok && rows.length === 0) pass(`A cannot read B's ${table}`)
    else if (!res.ok) pass(`A refused on B's ${table} (${res.status})`)
    else fail(`A READ ${rows.length} OF B'S ${table} ROWS`)
  }

  const seenById = await req(`attempts?select=*&id=eq.${marker}`, { token: tokenA })
  const byId = seenById.ok ? await seenById.json() : []
  if (byId.length === 0) pass("A cannot read B's attempt by its exact id")
  else fail("A READ B'S ATTEMPT BY ID")

  const upd = await req(`attempts?id=eq.${marker}`, {
    token: tokenA,
    method: 'PATCH',
    body: { is_correct: false },
  })
  const updated = upd.ok ? await upd.json() : []
  if (!upd.ok || updated.length === 0) pass("A cannot update B's attempt")
  else fail("A UPDATED B'S ATTEMPT")

  const forged = await req('attempts', {
    token: tokenA,
    method: 'POST',
    body: {
      id: `rls-forge-${Date.now()}`,
      user_id: idB,
      question_id: 'ls-low-002',
      section: 'latin-squares',
      difficulty: 'low',
      mode: 'practice',
      is_correct: true,
      attempted_at: new Date().toISOString(),
    },
  })
  if (forged.ok) fail('A INSERTED A ROW OWNED BY B')
  else pass(`A cannot insert as B (${forged.status})`)

  // Attempts are meant to be immutable even for their owner.
  const selfUpd = await req(`attempts?id=eq.${marker}`, {
    token: tokenB,
    method: 'PATCH',
    body: { is_correct: false },
  })
  const selfUpdated = selfUpd.ok ? await selfUpd.json() : []
  if (!selfUpd.ok || selfUpdated.length === 0) pass('B cannot rewrite its own attempt')
  else fail("B REWROTE ITS OWN ATTEMPT — attempts are supposed to be immutable")

  await req(`attempts?id=eq.${marker}`, { token: tokenB, method: 'DELETE' })
}

const [tokenA, tokenB] = process.argv.slice(2)

await schemaPresent()
await anonChecks()
if (tokenA && tokenB) await crossUserChecks(tokenA, tokenB)
else
  console.log(
    '\nNo tokens given, so cross-user isolation was not tested.\n' +
      'Run: node scripts/verify-rls.mjs <accessTokenA> <accessTokenB>',
  )

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) FAILED.\n`)
process.exit(failures === 0 ? 0 : 1)
