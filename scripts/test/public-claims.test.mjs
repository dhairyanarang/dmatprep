/**
 * What the product says about itself, and where it says it.
 *
 * The independence statement used to live on `/privacy` alone, reachable from
 * the account menu and the search dialog — and in guest mode the account menu
 * renders an inert icon with no link, so for the primary audience it was
 * reachable only by searching the command palette for it. A grep of the built
 * home page for `href="/privacy"` returned zero.
 *
 * These tests fix the claim and its reach in place. The build-output half runs
 * only when `.next` exists, so a clean checkout still passes; run
 * `npm run build` first for the full guarantee.
 *
 * These gates read `.next`, which survives a branch switch. A build made on
 * another branch will fail them for reasons that have nothing to do with the
 * current one — that happened once and cost a confused ten minutes. Build
 * before running them locally; CI checks out and builds fresh, so it cannot
 * hit this.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath, not .pathname: the repository path contains a space, and
// .pathname hands back %20, which would make every check below pass vacuously.
const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(join(root, p), 'utf8')

const NOT_AFFILIATED = 'not affiliated with, endorsed by, or sponsored by'
const TRADEMARK = 'dMAT is a trademark of g.a.s.t.'

/**
 * Every prerendered top-level page in the production build.
 *
 * `_global-error.html` is excluded, and only that one: Next's global error
 * boundary renders its own `<html>` and `<body>` and replaces the root layout
 * entirely, so no footer mounted in that layout can reach it. That is an
 * architectural exception, not a gap — if the list of exceptions ever grows,
 * this test should fail rather than be widened again.
 */
const LAYOUT_EXEMPT = new Set(['_global-error.html'])

function builtPages() {
  const dir = join(root, '.next/server/app')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.html') && !LAYOUT_EXEMPT.has(f))
    .map((f) => ({ name: f, html: readFileSync(join(dir, f), 'utf8') }))
}

test('the footer carries the independence statement and the trademark line', () => {
  const footer = read('components/layout/site-footer.tsx')
  assert.ok(footer.includes(NOT_AFFILIATED), 'footer lost the non-affiliation sentence')
  assert.ok(footer.includes('g.a.s.t.'), 'footer does not name g.a.s.t.')
  assert.ok(footer.includes('APS India'), 'footer does not name APS India')
  assert.ok(footer.includes(TRADEMARK), 'footer lost the trademark attribution')
})

test('the footer is mounted in the root layout, so it reaches every route', () => {
  const layout = read('app/layout.tsx')
  assert.ok(/import \{ SiteFooter \}/.test(layout), 'SiteFooter is not imported in the layout')
  assert.ok(/<SiteFooter\s*\/>/.test(layout), 'SiteFooter is not rendered in the layout')
})

test('the footer does not claim every practice question is independently authored', () => {
  // True of the GAM packs, which carry an originality gate and recorded
  // adjudication. Unevidenced for the 473 Core questions, which have neither.
  // The claim goes in when the provenance audit supports it, not before.
  const footer = read('components/layout/site-footer.tsx')
  assert.ok(
    !/questions are independently authored|all .*questions are original/i.test(footer),
    'the footer makes an originality claim the repository does not evidence',
  )
})

test('the README no longer claims there is no backend, database or auth', () => {
  const readme = read('README.md')
  assert.ok(
    !/no backend, database or auth/i.test(readme),
    'README still denies the backend, database and auth that exist',
  )
  assert.ok(!/single-user tool/i.test(readme), 'README still calls this a single-user tool')
})

test('the README does not assert that Core questions are original', () => {
  const readme = read('README.md')
  assert.ok(
    !/^Practice questions are original/m.test(readme),
    'README still asserts originality the repository does not evidence',
  )
  assert.ok(
    /establishes correctness, not originality/i.test(readme),
    'README should say plainly what the solver does and does not establish',
  )
})

test('the README carries no stale September 2026 exam date', () => {
  const readme = read('README.md')
  assert.ok(
    !/26 September 2026|15 September 2026/.test(readme),
    'README still carries the superseded September 2026 dates',
  )
})

test(
  'the independence statement reaches every prerendered page',
  { skip: builtPages().length === 0 },
  () => {
    const missing = builtPages()
      .filter((p) => !p.html.includes(NOT_AFFILIATED))
      .map((p) => p.name)
    assert.deepEqual(missing, [], 'pages built without the independence statement')
  },
)

test(
  'the home page links to the privacy statement',
  { skip: !existsSync(join(root, '.next/server/app/index.html')) },
  () => {
    const home = read('.next/server/app/index.html')
    assert.ok(
      home.includes('href="/privacy"'),
      'the home page does not link to /privacy — the guest-mode reachability bug is back',
    )
  },
)
