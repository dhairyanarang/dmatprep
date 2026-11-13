#!/usr/bin/env node
/**
 * Read the live dashboard's numbers from the terminal.
 *
 *   npm run clarity            show the last sweep, fetching one if none is fresh
 *   npm run clarity -- --fetch force a fresh sweep, spending request budget
 *   npm run clarity -- --days 1        narrow the window (1, 2 or 3)
 *   npm run clarity -- --raw           print the stored JSON instead of a summary
 *
 * THE CONSTRAINT THIS IS BUILT AROUND. Clarity's Data Export API allows ten
 * requests per project per day, and every request can only reach back one to
 * three days. Those are server-side and cannot be raised. So this caches every
 * response to disk and reads from the cache by default: asking a second question
 * about the same window costs nothing, and a day's questions cannot run the
 * budget dry. A sweep is four requests, which leaves six in hand.
 *
 * It follows that this tool answers "what is happening now", never "how many
 * people have ever visited". The all-time figure exists only in the dashboard's
 * own date filter. Nothing here can reconstruct it, and nothing here should
 * pretend to.
 *
 * The token is read from .env.local, which is gitignored. It is never sent
 * anywhere but clarity.ms, never committed, and has no business in Vercel — the
 * app does not use it; this is a reading tool for the repository, not a feature.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const cacheDir = new URL('.clarity/', root)
const ENDPOINT = 'https://www.clarity.ms/export-data/api/v1/project-live-insights'
const DAILY_LIMIT = 10

/* ------------------------------------------------------------------- token */

function token() {
  const fromEnv = process.env.CLARITY_API_TOKEN
  if (fromEnv) return fromEnv.trim()
  const envFile = new URL('.env.local', root)
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split('\n')) {
      const m = /^\s*CLARITY_API_TOKEN\s*=\s*(.+?)\s*$/.exec(line)
      if (m) return m[1].replace(/^["']|["']$/g, '')
    }
  }
  console.error(
    'No Clarity token found.\n\n' +
      'Add one line to .env.local (which is gitignored):\n\n' +
      '  CLARITY_API_TOKEN=<the token from Clarity → Settings → Data Export>\n\n' +
      'Generate it in the dMAT Prep project (y23r5jb7md) as a project admin.',
  )
  process.exit(1)
}

/* ------------------------------------------------------- the request budget */

const budgetFile = new URL('budget.json', cacheDir)
const today = () => new Date().toISOString().slice(0, 10)

function budget() {
  if (!existsSync(budgetFile)) return { date: today(), calls: 0 }
  const b = JSON.parse(readFileSync(budgetFile, 'utf8'))
  // The limit is per UTC day, and so is this.
  return b.date === today() ? b : { date: today(), calls: 0 }
}

function spend(n) {
  const b = budget()
  b.calls += n
  mkdirSync(cacheDir, { recursive: true })
  writeFileSync(budgetFile, `${JSON.stringify(b, null, 2)}\n`)
  return b
}

/* --------------------------------------------------------------- the sweep */

/**
 * One request per view. Separate single-dimension calls rather than one
 * three-dimension call: a cross-tab of URL by device by country fragments into
 * rows that say very little each, and the response is capped at a thousand rows
 * with no pagination.
 */
const SWEEP = [
  { as: 'overall', params: {} },
  { as: 'by-url', params: { dimension1: 'URL' } },
  { as: 'by-device', params: { dimension1: 'Device' } },
  { as: 'by-country', params: { dimension1: 'Country/Region' } },
]

async function fetchOne(bearer, days, params) {
  const url = new URL(ENDPOINT)
  url.searchParams.set('numOfDays', String(days))
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
  })

  if (res.status === 401) throw new Error('401 — the token is missing, invalid or expired.')
  if (res.status === 403) throw new Error('403 — this token is not authorised for that project.')
  if (res.status === 429) {
    throw new Error(
      '429 — the ten-request daily limit is spent. It resets at 00:00 UTC; ' +
        'read the cached sweep in the meantime.',
    )
  }
  if (!res.ok) throw new Error(`${res.status} — ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

async function sweep(days) {
  const bearer = token()
  const before = budget()
  if (before.calls + SWEEP.length > DAILY_LIMIT) {
    console.error(
      `A sweep needs ${SWEEP.length} requests and only ${DAILY_LIMIT - before.calls} remain today. ` +
        'The limit resets at 00:00 UTC.',
    )
    process.exit(1)
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const out = { fetchedAt: new Date().toISOString(), days, views: {} }
  for (const view of SWEEP) {
    process.stderr.write(`  fetching ${view.as}… `)
    out.views[view.as] = await fetchOne(bearer, days, view.params)
    spend(1)
    process.stderr.write('ok\n')
  }

  mkdirSync(cacheDir, { recursive: true })
  const file = new URL(`sweep-${stamp}.json`, cacheDir)
  writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`)
  const b = budget()
  console.error(`\nsaved .clarity/sweep-${stamp}.json · ${b.calls}/${DAILY_LIMIT} requests used today\n`)
  return out
}

function latest() {
  if (!existsSync(cacheDir)) return null
  const files = readdirSync(cacheDir).filter((f) => f.startsWith('sweep-')).sort()
  if (!files.length) return null
  return JSON.parse(readFileSync(new URL(files[files.length - 1], cacheDir), 'utf8'))
}

/* -------------------------------------------------------------- the report */

const num = (v) => (v === undefined || v === null ? null : Number(v))
/** The sample response spells it `distantUserCount`; take either. */
const users = (r) => num(r.distinctUserCount) ?? num(r.distantUserCount)

const metric = (payload, name) =>
  (Array.isArray(payload) ? payload : []).find((m) => m.metricName === name)?.information ?? []

function total(rows, field) {
  return rows.reduce((n, r) => n + (num(r[field]) ?? 0), 0)
}

function report(sweepData) {
  const { views, fetchedAt, days } = sweepData
  const age = Math.round((Date.now() - new Date(fetchedAt).getTime()) / 60000)
  console.log(`\ndMAT Prep · Clarity · last ${days} day(s)`)
  console.log(`fetched ${age < 1 ? 'just now' : `${age} min ago`} · ${fetchedAt}\n`)

  const traffic = metric(views.overall, 'Traffic')
  if (traffic.length) {
    const sessions = total(traffic, 'totalSessionCount')
    const bots = total(traffic, 'totalBotSessionCount')
    const uu = traffic.reduce((n, r) => n + (users(r) ?? 0), 0)
    console.log('TRAFFIC')
    console.log(`  sessions        ${sessions}`)
    console.log(`  unique users    ${uu}`)
    console.log(`  bot sessions    ${bots}  (excluded from the figures above)`)
  } else {
    console.log('TRAFFIC  — no rows returned for this window')
  }

  // The friction metrics, which are the reason to look at this at all.
  const friction = [
    ['Dead clicks', 'Dead Click Count'],
    ['Rage clicks', 'Rage Click Count'],
    ['Quick backs', 'Quickback Click'],
    ['Excessive scroll', 'Excessive Scroll'],
    ['Script errors', 'Script Error Count'],
    ['Error clicks', 'Error Click Count'],
  ]
  console.log('\nFRICTION (whole site)')
  for (const [label, name] of friction) {
    const rows = metric(views.overall, name)
    if (!rows.length) {
      console.log(`  ${label.padEnd(17)} —`)
      continue
    }
    const first = rows[0]
    const count =
      num(first.subTotal) ?? num(first.count) ?? num(first.sessionsCount) ?? num(first.sessionsWithMetricPercentage)
    console.log(`  ${label.padEnd(17)} ${count ?? JSON.stringify(first)}`)
  }

  // Where the friction is, which is the question a whole-site percentage cannot
  // answer and the reason the URL breakdown is worth one of the ten requests.
  for (const [label, name] of [
    ['DEAD CLICKS BY PAGE', 'Dead Click Count'],
    ['RAGE CLICKS BY PAGE', 'Rage Click Count'],
  ]) {
    const rows = metric(views['by-url'], name)
    if (!rows.length) continue
    console.log(`\n${label}`)
    const scored = rows
      .map((r) => ({
        url: r.URL ?? r.Url ?? r.url ?? '(unnamed)',
        n: num(r.subTotal) ?? num(r.count) ?? num(r.sessionsCount) ?? 0,
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 8)
    for (const s of scored) console.log(`  ${String(s.n).padStart(5)}  ${s.url}`)
  }

  for (const [label, view, key] of [
    ['DEVICE', 'by-device', 'Device'],
    ['COUNTRY', 'by-country', 'Country/Region'],
  ]) {
    const rows = metric(views[view], 'Traffic')
    if (!rows.length) continue
    console.log(`\n${label}`)
    const scored = rows
      .map((r) => ({ k: r[key] ?? '(unknown)', n: num(r.totalSessionCount) ?? 0 }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 8)
    for (const s of scored) console.log(`  ${String(s.n).padStart(6)}  ${s.k}`)
  }

  console.log(
    '\nThis is a rolling window of at most three days — the API cannot reach further back.\n' +
      'The all-time total lives only in the dashboard\'s own date filter.\n',
  )
}

/* ----------------------------------------------------------------- the CLI */

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(`--${name}`)
const value = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}

const days = Math.min(3, Math.max(1, Number(value('days', 3)) || 3))
let data = flag('fetch') ? await sweep(days) : latest()

if (!data) {
  console.error('No cached sweep yet — fetching one.\n')
  data = await sweep(days)
}

if (flag('raw')) console.log(JSON.stringify(data, null, 2))
else report(data)

const b = budget()
console.error(`requests used today: ${b.calls}/${DAILY_LIMIT}\n`)
