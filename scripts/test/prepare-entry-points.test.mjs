/**
 * The shape of Prepare, after the 21 November 2026 refinement.
 *
 * Three things were decided and each is easy to undo without noticing:
 *
 *  · A subtest has exactly TWO ways in — Learn the rules and Practice. It had
 *    three, and the third pointed at `/practice/timed/<section>`, which is the
 *    Test section's own route. Two front doors to one room is how a product
 *    grows a duplicate.
 *  · The Overview/Practice tab strip is gone. It was a second navigation for a
 *    decision the landing page had already taken, and its heading block pushed
 *    the first question most of a screen down.
 *  · The hint sidebar is a PERMANENT column on desktop, not something that
 *    opens. It is driven by a selection, which is what keeps it in step with
 *    the question list.
 *
 * The timed ROUTE is deliberately untouched: Test links to it, so these also
 * assert it is still there and still reachable.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(root + p, 'utf8')

const landing = read('app/module-a/[section]/page.tsx')
const layout = read('app/module-a/[section]/layout.tsx')
const runner = read('components/practice/practice-runner.tsx')
const panel = read('components/practice/solution-panel.tsx')
const bar = read('components/practice/practice-bar.tsx')
const css = read('app/globals.css')

describe('a subtest has two entry points', () => {
  test('the landing offers Learn the rules and Practice, and nothing else', () => {
    const hrefs = [...landing.matchAll(/href=\{`([^`]+)`\}/g)].map((m) => m[1])
    assert.deepEqual(
      hrefs.sort(),
      ['/module-a/${section}/overview', '/module-a/${section}/practice'],
      'the subtest landing offers something other than the two agreed entry points',
    )
  })

  test('it does not link the Test section’s timed route', () => {
    const links = [...landing.matchAll(/href=\{`([^`]+)`\}/g)].map((m) => m[1])
    assert.ok(
      !links.some((href) => href.includes('practice/timed')),
      'the Timed practice card is back — that route belongs to Test',
    )
  })

  test('the timed route still exists and Test still points at it', () => {
    // Removing the duplicate entry point must not remove the experience.
    assert.ok(
      existsSync(root + 'app/practice/timed/[section]/page.tsx'),
      'the timed practice route was deleted, not just unlinked',
    )
    const testPage = read('app/test/page.tsx')
    assert.match(testPage, /\/practice\/timed\/\$\{section\.id\}/, 'Test stopped linking timed sets')
    assert.match(testPage, /getCoreMocks\(\)/, 'Test stopped listing the fixed mocks')
  })

  test('the timed runner and launcher are untouched', () => {
    for (const file of [
      'components/practice/timed-runner.tsx',
      'components/practice/timed-launcher.tsx',
    ]) {
      assert.ok(existsSync(root + file), `${file} was removed — Test depends on it`)
    }
  })
})

describe('Practice opens on the questions', () => {
  test('the Overview/Practice tab strip is gone', () => {
    assert.ok(
      !existsSync(root + 'components/layout/section-tabs.tsx'),
      'the tab component is back',
    )
    assert.ok(!/SectionTabs/.test(layout), 'the layout still renders the tab strip')
  })

  test('the layout is a container, not a header', () => {
    // The heading moved to the screen it describes. Practice does not want a
    // paragraph of explanation above its first question.
    assert.ok(!/<h1/.test(layout), 'the layout draws a heading for every screen below it')
    assert.match(read('app/module-a/[section]/overview/page.tsx'), /<h1/, 'Learn the rules lost its heading')
  })

  test('the control bar carries the filters and the navigator', () => {
    assert.match(bar, /aria-label="Jump to question"/)
    for (const label of ['All', 'To do', 'Missed', 'Any']) {
      assert.ok(
        new RegExp(`['"]${label}['"]`).test(bar),
        `the ${label} filter went missing`,
      )
    }
    // Low / Medium / High come from DIFFICULTIES rather than being written out.
    assert.match(bar, /DIFFICULTIES\.map/, 'the difficulty filters are no longer derived')
  })

  test('the navigator marks the selected question', () => {
    assert.match(bar, /aria-current=\{dot\.id === current/)
    assert.match(bar, /dot\.id === current &&/, 'nothing rings the current question')
  })

  test('the navigator reports difficulty without inventing a second colour', () => {
    // The prototype's dots encode status only. Difficulty rides in the label.
    assert.match(bar, /dot\.difficulty/)
    assert.match(runner, /difficulty: question\.difficulty/)
  })
})

describe('the hint sidebar is a column, not something that opens', () => {
  test('it is driven by a selection that always resolves', () => {
    assert.match(runner, /const selected = visible\.find\(\(q\) => q\.id === selectedId\) \?\? visible\[0\]/)
    assert.ok(!/detailId/.test(runner), 'the old open/closed flag is back')
  })

  test('the selection is resolved against what is on screen', () => {
    // Filtering to "Missed" while the sidebar shows a question no longer in the
    // list is the desynchronisation this prevents.
    assert.match(runner, /visible\.find\(\(q\) => q\.id === selectedId\)/)
  })

  test('hints are read from the selected question, so they cannot bleed', () => {
    assert.match(runner, /selectedAnswer = \(selected && answers\[selected\.id\]\)/)
    assert.match(runner, /hintsUsed=\{selectedAnswer\.hintsUsed\}/)
    assert.match(runner, /key=\{selected\.id\}/, 'the panel is reused across questions')
    assert.ok(
      !/useState[^\n]*hint/i.test(panel),
      'the panel holds hint state of its own, which would survive a question change',
    )
  })

  test('the navigator moves the page and the sidebar together', () => {
    assert.match(runner, /setSelectedId\(id\)/)
    assert.match(runner, /scrollIntoView/)
  })
})

describe('the sidebar reproduces the prototype’s dimensions', () => {
  test('420px wide, square, bordered on its left edge only', () => {
    const desktop = /@media \(min-width: 1024px\) \{\s*\.spanel \{([\s\S]*?)\}/.exec(css)
    assert.ok(desktop, 'the desktop .spanel rule is missing')
    const block = desktop[1]
    assert.match(block, /width: 420px/, 'the prototype panel is 420px')
    assert.match(block, /border-radius: 0/, 'the prototype panel is square')
    assert.match(block, /border-left: 1px solid var\(--line2\)/)
    assert.match(block, /position: sticky/)
  })

  test('inset is reset before top, or it never sticks', () => {
    // Declared the other way round, `inset: auto` sets `top: auto` and a sticky
    // element with no offset scrolls away. It looked right at rest and failed
    // the moment the page moved, which is exactly how it shipped once.
    const desktop = /@media \(min-width: 1024px\) \{\s*\.spanel \{([\s\S]*?)\}/.exec(css)[1]
    assert.ok(
      desktop.indexOf('inset: auto') < desktop.indexOf('top: var(--ptop'),
      'inset is declared after top, so the sticky offset is reset to auto',
    )
  })

  test('its offset is measured from the control bar, not assumed', () => {
    // The bar wraps its navigator and chips, so it is not a fixed height. A
    // constant put the panel header underneath it.
    assert.match(runner, /ResizeObserver/)
    assert.match(runner, /setProperty\(\s*'--ptop'/)
    assert.match(css, /top: var\(--ptop, 141px\)/)
    assert.match(css, /height: calc\(100vh - var\(--ptop, 141px\)\)/)
  })

  test('it is a drawer below lg and a column above, never an overlay on desktop', () => {
    assert.match(css, /\.spanel \{[\s\S]*?position: fixed/, 'no drawer treatment for phones')
    assert.match(panel, /hiddenOnMobile && 'max-lg:hidden'/)
    // A permanent column has nothing to close, so the close control is mobile-only.
    assert.match(panel, /lg:hidden/)
  })
})
