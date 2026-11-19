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

/*
 * The global footer is gone. It carried three paragraphs of legal text under
 * every screen, including a half-answered practice question.
 *
 * What replaced it is deliberately split, and these tests pin both halves:
 *
 *   · the FULL statement in `PageDisclaimer`, rendered on the informational
 *     pages where someone would actually read it;
 *   · a ONE-LINE version in `SidebarFooter`, which the sidebar renders on every
 *     route — this is what keeps the non-affiliation claim present everywhere,
 *     and what `release:check` gate 6 measures against the built HTML.
 *
 * Losing either half silently is the failure these guard against.
 */

test('the page disclaimer carries the independence statement and the trademark line', () => {
  const disclaimer = read('components/layout/page-disclaimer.tsx')
  assert.ok(disclaimer.includes(NOT_AFFILIATED), 'the disclaimer lost the non-affiliation sentence')
  assert.ok(disclaimer.includes('g.a.s.t.'), 'the disclaimer does not name g.a.s.t.')
  assert.ok(disclaimer.includes('APS India'), 'the disclaimer does not name APS India')
  assert.ok(disclaimer.includes(TRADEMARK), 'the disclaimer lost the trademark attribution')
})

test('the one-line statement is in the sidebar, which every route renders', () => {
  const sidebarFooter = read('components/layout/sidebar-footer.tsx')
  assert.ok(
    sidebarFooter.includes(NOT_AFFILIATED),
    'the sidebar lost the non-affiliation sentence — no route would carry it',
  )

  // Mounted in both the desktop aside and the mobile sheet, or half the users
  // never see it.
  const aside = read('components/layout/app-sidebar.tsx')
  const mobile = read('components/layout/mobile-nav.tsx')
  assert.ok(/<SidebarFooter\s*\/>/.test(aside), 'SidebarFooter is not in the desktop sidebar')
  assert.ok(/<SidebarFooter\b/.test(mobile), 'SidebarFooter is not in the mobile navigation')
})

test('no global footer has crept back into the root layout', () => {
  const layout = read('app/layout.tsx')
  assert.ok(!/SiteFooter/.test(layout), 'the global footer is back in the layout')
  assert.ok(!existsSync(join(root, 'components/layout/site-footer.tsx')), 'site-footer.tsx is back')
})

test('the disclaimer does not claim every practice question is independently authored', () => {
  // True of the GAM packs, which carry an originality gate and recorded
  // adjudication. The Core claim is evidenced now, but the phrasing below would
  // over-claim for Module B, which nobody has signed off.
  const disclaimer = read('components/layout/page-disclaimer.tsx')
  assert.ok(
    !/questions are independently authored|all .*questions are original/i.test(disclaimer),
    'the disclaimer makes an originality claim the repository does not evidence',
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
