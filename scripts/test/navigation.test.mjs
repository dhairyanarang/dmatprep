/**
 * Every internal link goes somewhere, and every route can be reached.
 *
 * This is a structural test, not a rendering one: it reads the source rather
 * than the running app, so it costs nothing and runs everywhere. It exists
 * because a dead link is invisible until somebody clicks it — `href="/practice"`
 * looked fine in review for as long as it took to notice the label said
 * "Another test" and the page it landed on was Test.
 *
 * It checks both directions. A link with no route is a dead end; a route with
 * no link is a page nobody can find, which is the same defect seen from the
 * other side.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath, not `.pathname`: the repository path contains a space, which
// a URL percent-encodes and `readdirSync` then cannot find.
const root = fileURLToPath(new URL('../../', import.meta.url))
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.playwright-mcp', 'drafts'])

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, out)
    else out.push(path)
  }
  return out
}

/* ------------------------------------------------------------------ routes */

const appFiles = walk(join(root, 'app'))

/** Every route with a page, route groups stripped. */
const routes = new Set(
  appFiles
    .filter((f) => f.endsWith('/page.tsx'))
    .map((f) => {
      const rel = '/' + relative(join(root, 'app'), f).replace(/\/?page\.tsx$/, '')
      const stripped = rel.replace(/\/\([^)]+\)/g, '')
      return stripped === '/' || stripped === '' ? '/' : stripped.replace(/\/$/, '')
    }),
)

/** Redirect and rewrite sources count as reachable destinations. */
const config = readFileSync(join(root, 'next.config.ts'), 'utf8')
const configured = new Set([...config.matchAll(/source:\s*'([^']+)'/g)].map((m) => m[1]))

function resolves(href) {
  if (routes.has(href) || configured.has(href)) return true
  for (const route of [...routes, ...configured]) {
    if (!route.includes('[') && !route.includes(':')) continue
    const pattern = route
      .replace(/\[\.\.\.[^\]]+\]/g, '.+')
      .replace(/\[[^\]]+\]/g, '[^/]+')
      .replace(/:[A-Za-z]+\*?/g, '[^/]+')
    if (new RegExp(`^${pattern}$`).test(href)) return true
  }
  return false
}

/* ------------------------------------------------------------------- links */

const sources = [
  ...walk(join(root, 'app')),
  ...walk(join(root, 'components')),
  ...walk(join(root, 'lib')),
  ...walk(join(root, 'content')),
].filter((f) => /\.tsx?$/.test(f))

/** Internal hrefs, with any `${…}` segment reduced to a wildcard. */
function internalLinks() {
  const found = new Map()
  for (const file of sources) {
    const text = readFileSync(file, 'utf8')
    const patterns = [
      /href=\{?[`"'](\/[^`"'\s]*)[`"']/g,
      /(?:href|destination):\s*[`"'](\/[^`"'\s]*)[`"']/g,
    ]
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const href = match[1].split('#')[0].split('?')[0].replace(/\/$/, '') || '/'
        if (!found.has(href)) found.set(href, new Set())
        found.get(href).add(relative(root, file))
      }
    }
  }
  return found
}

test('every internal link points at a route that exists', () => {
  const dead = []
  for (const [href, files] of internalLinks()) {
    // API routes and static assets are not pages.
    if (href.startsWith('/api/') || href.startsWith('/solutions/')) continue
    // A computed segment stands in for whatever it resolves to.
    const probe = href.replace(/\$\{[^}]*\}/g, 'x')
    if (probe.includes('${')) continue
    if (!resolves(probe)) dead.push(`${href}  <-  ${[...files].join(', ')}`)
  }
  assert.deepEqual(dead, [], `dead internal links:\n  ${dead.join('\n  ')}`)
})

test('every route can be reached from somewhere in the product', () => {
  const links = [...internalLinks().keys()].map((h) => h.replace(/\$\{[^}]*\}/g, 'x'))

  const unreachable = []
  for (const route of routes) {
    if (route === '/') continue
    const pattern = route.replace(/\[\.\.\.[^\]]+\]/g, '.+').replace(/\[[^\]]+\]/g, '[^/]+')
    const matcher = new RegExp(`^${pattern}$`)
    if (links.some((href) => matcher.test(href))) continue
    unreachable.push(route)
  }

  assert.deepEqual(
    unreachable,
    [],
    `routes nothing links to — either link them or delete them:\n  ${unreachable.join('\n  ')}`,
  )
})

test('NEGATIVE CONTROL: the resolver rejects a route that does not exist', () => {
  // Verified once by planting `href="/does-not-exist"` in a component, which
  // failed the first test and named the file. This keeps the resolver honest
  // without needing the plant: a matcher that said yes to everything would
  // make both tests above pass while catching nothing.
  assert.equal(resolves('/does-not-exist'), false)
  assert.equal(resolves('/exam/not-a-page'), false)
  assert.equal(resolves('/'), true, 'the resolver rejects a route that plainly exists')
  assert.equal(resolves('/test/mock/core-mock-1'), true, 'dynamic routes must still resolve')
})
