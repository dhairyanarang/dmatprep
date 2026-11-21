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

describe('the sidebar is fixed to the viewport edge and toggles', () => {
  test('420px, pinned to the right edge, bordered on its left only', () => {
    const rule = /\.spanel \{([\s\S]*?)\n  \}/.exec(css)
    assert.ok(rule, 'the .spanel rule is missing')
    const block = rule[1]
    assert.match(block, /position: fixed/, 'the panel is not fixed to the viewport')
    assert.match(block, /right: 0/, 'the panel is not on the right edge')
    assert.match(block, /width: min\(420px, 100%\)/, 'the prototype panel is 420px')
    assert.match(block, /border-left: 1px solid var\(--line2\)/)
    assert.match(block, /top: var\(--ptop, 141px\)/, 'the panel does not start below the control bar')
  })

  test('it passes beneath the control bar rather than over it', () => {
    // `--ptop` is the bar's STUCK position, so before the page is scrolled the
    // bar sits lower and the two overlap. The bar holds the navigator and the
    // filters, so it has to win that strip.
    const block = /\.spanel \{([\s\S]*?)\n  \}/.exec(css)[1]
    const z = /z-index: (\d+)/.exec(block)
    assert.ok(z, 'the panel has no z-index')
    assert.ok(Number(z[1]) < 15, `panel z-index ${z[1]} is not below the control bar's 15`)
  })

  test('its offset is measured from the control bar, not assumed', () => {
    // The bar wraps its chips, so it is not a fixed height.
    assert.match(runner, /ResizeObserver/)
    assert.match(runner, /setProperty\(\s*'--ptop'/)
  })

  test('a closed panel reserves nothing', () => {
    // It only makes room while it is open, and because the panel is fixed the
    // question column is full width the rest of the time.
    assert.match(css, /\.pwrap-open \{\s*padding-right: 420px/)
    assert.match(runner, /panelOpen && 'pwrap-open'/)
    assert.match(runner, /\{selected && panelOpen \?/, 'the panel renders when closed')
  })

  test('it is closed by default and the trigger toggles it', () => {
    assert.match(runner, /useState\(false\)/)
    assert.match(runner, /if \(panelOpen && selected\?\.id === question\.id\) \{/, 'the trigger does not toggle')
    assert.match(runner, /setPanelOpen\(false\)/)
    assert.match(panel, /aria-label="Close hints and solution"/)
    assert.match(runner, /onClose=\{\(\) => setPanelOpen\(false\)\}/)
  })

  test('the close control is available at every width', () => {
    // It used to be mobile-only, because the panel was a permanent column that
    // could not be closed. It can be closed now, everywhere.
    const closeBtn = /aria-label="Close hints and solution"[\s\S]{0,400}?\/>/.exec(panel)
    assert.ok(closeBtn, 'the close button is gone')
    assert.ok(!/lg:hidden/.test(closeBtn[0]), 'the close button is hidden on desktop')
  })

  test('a phone gets an overlay it can dismiss, not a column', () => {
    assert.match(
      css,
      /@media \(max-width: 1023px\) \{[\s\S]*?\.spanel \{[\s\S]*?z-index: 66/,
      'the phone treatment is gone',
    )
  })
})
