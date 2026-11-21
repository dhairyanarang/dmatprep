/**
 * Global search must only offer pages that exist.
 *
 * A removed page is the dangerous case: `/refunds` and `/about` still resolve,
 * because both redirect somewhere sensible, so a search entry pointing at one
 * would look fine to a link checker and feel broken to a person — they would
 * search "refunds", click the result, and land on Terms with no explanation.
 *
 * So this is stricter than the navigation audit: a search result must be a
 * real page, not a redirect to one.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(join(root, p), 'utf8')

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.next', '.git', '.playwright-mcp'].includes(entry)) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, out)
    else out.push(path)
  }
  return out
}

/** Routes that have a real page file, route groups stripped. */
const pages = new Set(
  walk(join(root, 'app'))
    .filter((f) => f.endsWith('/page.tsx'))
    .map((f) => {
      const rel = '/' + relative(join(root, 'app'), f).replace(/\/?page\.tsx$/, '')
      const stripped = rel.replace(/\/\([^)]+\)/g, '')
      return stripped === '/' || stripped === '' ? '/' : stripped.replace(/\/$/, '')
    }),
)

const entries = read('lib/search/entries.ts')
const nav = read('lib/nav.ts')

/** Every href a search entry can produce, with computed segments wildcarded. */
function searchHrefs() {
  const out = new Set()
  for (const match of entries.matchAll(/href: [`'](\/[^`']*)[`']/g)) {
    out.add(match[1].replace(/\$\{[^}]*\}/g, 'x').split('#')[0])
  }
  // The informational entries are generated from INFO_LINKS rather than
  // written here, so they have to be read from where they actually live.
  for (const match of nav.matchAll(/\{ href: '(\/[^']*)', label:/g)) out.add(match[1])
  return [...out]
}

function resolvesToAPage(href) {
  if (pages.has(href)) return true
  for (const route of pages) {
    if (!route.includes('[')) continue
    const pattern = route.replace(/\[\.\.\.[^\]]+\]/g, '.+').replace(/\[[^\]]+\]/g, '[^/]+')
    if (new RegExp(`^${pattern}$`).test(href)) return true
  }
  return false
}

test('every search result is a real page, not a redirect', () => {
  const broken = searchHrefs().filter((href) => !resolvesToAPage(href))
  assert.deepEqual(broken, [], `search offers pages that do not exist:\n  ${broken.join('\n  ')}`)
})

test('removed pages are not in search', () => {
  // Named explicitly, because these two still resolve as redirects and so
  // would pass the check above if it were based on reachability.
  for (const gone of ['/about', '/refunds', '/study-plan', '/review']) {
    assert.ok(
      !searchHrefs().includes(gone),
      `${gone} was removed from the product but is still offered in search`,
    )
  }
})

test('search indexes every top-level destination', () => {
  // The sidebar and search must agree on where you can go.
  const hrefs = searchHrefs()
  for (const match of nav.matchAll(/href: '(\/[^']*)', label: '[^']+', hint:/g)) {
    assert.ok(hrefs.includes(match[1]), `${match[1]} is in the sidebar but not in search`)
  }
})

test('search carries no answer, explanation or question body', () => {
  // It is a way to reach a page, not a way to read a key. The guide headings
  // it does index are teaching text that is already on a public page.
  assert.ok(
    !/correctOptionId|distractorNotes|walkthrough/.test(entries),
    'the search index reaches into solution fields',
  )
  assert.ok(
    !/from '@\/lib\/content\/registry'/.test(entries),
    'the search index imports the question bank, which would ship it to every page',
  )
})

test('NEGATIVE CONTROL: the resolver rejects a page that does not exist', () => {
  assert.equal(resolvesToAPage('/not-a-page'), false)
  assert.equal(resolvesToAPage('/'), true)
  assert.equal(resolvesToAPage('/test/mock/core-mock-1'), true)
})
