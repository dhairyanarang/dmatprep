/**
 * Drafts must stay out of the product.
 *
 * `drafts/` holds unapproved candidate questions, answer keys and all. The
 * obvious way to look at a draft — put it in the bank and open the practice
 * page — would publish unreviewed material, so instead it is rendered by
 * `scripts/preview-drafts.mjs` into a standalone HTML file that Next.js never
 * sees. This asserts that separation rather than trusting it.
 *
 * The build-output half of the check runs only when `.next` exists, so the
 * suite still passes on a clean checkout. Run `npm run build` first for the
 * full guarantee.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath, not .pathname: the repository path contains a space and
// .pathname hands back %20, which silently makes every check below vacuous.
const root = fileURLToPath(new URL('../../', import.meta.url))
const draftsDir = join(root, 'drafts')

/** Every question id that exists only in drafts. */
function draftIds() {
  const ids = new Set()
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (name.endsWith('.json')) {
        for (const m of readFileSync(full, 'utf8').matchAll(/"(?:id|packId)":\s*"([^"]*-p\d+[^"]*)"/g)) {
          ids.add(m[1])
        }
      }
    }
  }
  if (existsSync(draftsDir)) walk(draftsDir)
  return [...ids]
}

/** Every file the application could reach: source, content registries, config. */
function appFiles() {
  const out = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(ts|tsx|mjs|js|json)$/.test(name)) out.push(full)
    }
  }
  for (const d of ['app', 'lib', 'components', 'content']) {
    const full = join(root, d)
    if (existsSync(full)) walk(full)
  }
  return out
}

test('drafts exist and carry pilot ids, so this test has something to check', () => {
  const ids = draftIds()
  assert.ok(ids.length > 0, 'no draft ids found — update this test if drafts moved')
})

test('nothing under app, lib, components or content imports from drafts/', () => {
  const offenders = appFiles().filter((f) => /from\s+['"][^'"]*drafts\//.test(readFileSync(f, 'utf8')))
  assert.deepEqual(offenders, [], 'an application file imports a draft')
})

test('no draft question id appears in application source or content', () => {
  const ids = draftIds()
  const hits = []
  for (const file of appFiles()) {
    const text = readFileSync(file, 'utf8')
    for (const id of ids) if (text.includes(id)) hits.push(`${file} contains ${id}`)
  }
  assert.deepEqual(hits, [], 'a draft id reached application source or content')
})

test('no draft question id appears in the production build output', { skip: !existsSync(join(root, '.next')) }, () => {
  const ids = draftIds()
  const hits = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) {
        if (name === 'cache') continue
        walk(full)
      } else if (/\.(js|html|rsc|json|txt)$/.test(name)) {
        const text = readFileSync(full, 'utf8')
        for (const id of ids) if (text.includes(id)) hits.push(`${full} contains ${id}`)
      }
    }
  }
  walk(join(root, '.next'))
  assert.deepEqual(hits, [], 'a draft id reached the build output')
})
