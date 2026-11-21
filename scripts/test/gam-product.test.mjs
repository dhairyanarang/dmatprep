/**
 * The GAM product layer.
 *
 * These assert the boundaries that matter: that GAM content and Core content
 * stay apart, that a retired pack cannot reach the interface, and that nothing
 * in the product can present an unreviewed pack as reviewed.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
const packsDir = new URL('../../content/gam/packs/', import.meta.url)
const files = readdirSync(packsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(new URL(f, packsDir), 'utf8')))
const active = files.filter((f) => f.pack.provenance.reviewStatus !== 'rejected')
const retired = files.filter((f) => f.pack.provenance.reviewStatus === 'rejected')

describe('GAM product — content boundaries', () => {
  test('the GAM registry is separate from the Core registry', () => {
    const core = read('../../lib/content/registry.ts')
    assert.ok(!core.includes('content/gam'), 'the Core registry reaches into GAM content')
    const gam = read('../../lib/gam/registry.ts')
    assert.ok(!gam.includes('content/sections'), 'the GAM registry reaches into Core banks')
  })

  test('GAM keeps its own progress store rather than widening the Core one', () => {
    const core = read('../../lib/progress/store.ts')
    assert.ok(!core.toLowerCase().includes('gam'), 'the Core progress store knows about GAM')
    const gam = read('../../lib/gam/progress.ts')
    assert.match(gam, /dmat-prep:gam:v1/, 'the GAM store has no key of its own')
    assert.ok(
      !gam.includes("from '@/lib/progress/store'"),
      'the GAM store is built on the Core store',
    )
  })

  test('only the GAM store touches localStorage for GAM', () => {
    const runner = read('../../components/gam/pack-runner.tsx')
    assert.ok(!runner.includes('localStorage'), 'the runner reads storage directly')
    const results = read('../../components/gam/results.tsx')
    assert.ok(!results.includes('localStorage'))
  })

  test('the registry excludes the retired pack from everything the product can reach', () => {
    const gam = read('../../lib/gam/registry.ts')
    assert.match(gam, /reviewStatus === 'rejected'/, 'nothing filters retired packs out')
    assert.match(gam, /const ACTIVE = FILES\.filter/)
    assert.ok(retired.length > 0, 'no retired pack to check against')
    // getPacks, getPack, getPackIds and the totals all read ACTIVE.
    for (const symbol of ['getPacks', 'getPack ', 'getPackIds', 'totalGamQuestions', 'allPackQuestions']) {
      const at = gam.indexOf(`export const ${symbol.trim()}`)
      assert.ok(at > 0, `${symbol} is missing`)
      assert.ok(
        gam.slice(at, at + 260).includes('ACTIVE'),
        `${symbol} does not read the active set`,
      )
    }
  })
})

describe('GAM product — nothing claims a review that has not happened', () => {
  test('readiness reads the pack\'s own review status and nothing else', () => {
    const gam = read('../../lib/gam/registry.ts')
    assert.match(gam, /reviewStatus === 'human-reviewed' \? 'reviewed' : 'pilot'/)
  })

  test('no active pack claims human review, so the interface must say pilot', () => {
    for (const f of active) {
      assert.notEqual(
        f.pack.provenance.reviewStatus,
        'human-reviewed',
        `${f.pack.id} claims sign-off no person gave`,
      )
    }
  })

  test('the hub renders a notice that names what has and has not happened', () => {
    const notice = read('../../components/gam/pilot-notice.tsx')
    assert.match(notice, /automated validation/i)
    assert.match(notice, /independent adjudication|independent adjudication round/i)
    assert.match(notice, /signed off by a person/i)
    const hub = read('../../app/module-b/page.tsx')
    assert.match(hub, /GamPilotNotice/, 'the hub does not render the notice')
  })

  test('the entry points describe the packs as pilot material', () => {
    for (const page of ['../../app/prepare/page.tsx', '../../app/test/page.tsx']) {
      assert.match(read(page), /not yet reviewed by a person/i, `${page} oversells the packs`)
    }
  })
})

describe('GAM product — official versus product behaviour', () => {
  test('the 90-minute duration is marked as official and used by the timed route', () => {
    const gam = read('../../lib/gam/registry.ts')
    assert.match(gam, /OFFICIAL \(GAM PDF p\. 34\)[\s\S]{0,120}90 minutes/)
    assert.match(gam, /GAM_TOTAL_MINUTES = 90/)
    const timed = read('../../app/module-b/timed/page.tsx')
    assert.match(timed, /GAM_TOTAL_MINUTES/)
  })

  test('everything the official material does not specify is marked as product behaviour', () => {
    const timed = read('../../app/module-b/timed/page.tsx')
    assert.match(timed, /PRODUCT BEHAVIOUR, not official/)
  })

  test('a session deadline is absolute, never a remaining-seconds counter', () => {
    const runner = read('../../components/gam/pack-runner.tsx')
    assert.match(runner, /endsAt/, 'no absolute deadline')
    assert.ok(
      !/remainingMs\s*[-+]=|setRemaining\(\(\w+\) =>/.test(runner),
      'the clock counts down from a stored remainder instead of a deadline',
    )
  })
})

describe('GAM product — navigation', () => {
  test('every GAM route has a breadcrumb trail rather than falling through', () => {
    const crumbs = read('../../lib/breadcrumbs.ts')
    assert.match(crumbs, /'\/module-b': \[/)
    assert.match(crumbs, /'\/module-b\/timed'/)
    assert.match(crumbs, /parts\[0\] === 'module-b' && parts\[1\] === 'practice'/)
  })

  test('Module B is reachable from Prepare and from Test, and never from the sidebar', () => {
    assert.match(read('../../app/prepare/page.tsx'), /href="\/module-b"/)
    assert.match(read('../../app/test/page.tsx'), /href="\/module-b\/timed"/)

    const nav = read('../../lib/nav.ts')
    const links = nav.slice(nav.indexOf('export const NAV'), nav.indexOf('const OWNS'))
    assert.ok(!links.includes('module-b'), 'Module B was added to the sidebar as a destination')

    /**
     * Five rows, in two groups.
     *
     * This asserted four until Information became a section with its own
     * landing page and internal sidebar rather than a dropdown in the
     * sidebar's footer — a change asked for directly, and the shape the v2
     * prototype has: Home, Prepare and Test under "Main menu", About the Exam
     * and Information under "The exam".
     *
     * The number is still pinned, because the point of the rule was never the
     * figure four. It was that the sidebar does not grow quietly: a sixth row
     * should take a decision and an edit here, not a convenient afternoon.
     */
    const navBlock = links.slice(links.indexOf('export const NAV'), links.indexOf('export const INFO_LINKS'))
    assert.equal((navBlock.match(/href: '/g) ?? []).length, 5, 'the sidebar grew a row')
    assert.match(navBlock, /href: '\/information'/, 'Information left the sidebar')
    assert.match(nav, /path\.startsWith\('\/module-b\/timed'\)/, 'the timed session is not owned by Test')
  })
})

describe('GAM product — routes exist for every active pack', () => {
  test('the practice route is generated from the active registry', () => {
    const page = read('../../app/module-b/practice/[pack]/page.tsx')
    assert.match(page, /generateStaticParams/)
    assert.match(page, /getPackIds\(\)/)
    assert.match(page, /notFound\(\)/, 'an unknown pack id does not 404')
  })

  test('every active pack has a title and blocks the route can render', () => {
    for (const f of active) {
      assert.ok(f.pack.title?.length > 3, `${f.pack.id} has no usable title`)
      assert.ok(f.pack.blocks.length > 0)
      for (const b of f.pack.blocks) {
        assert.ok(
          ['heading', 'paragraph', 'list', 'formula', 'table', 'figure'].includes(b.kind),
          `${f.pack.id} carries a block kind the view cannot render: ${b.kind}`,
        )
      }
    }
  })

  test('Core routes and the Core bank are untouched by the GAM work', () => {
    const counts = ['figure-sequences', 'mathematical-equations', 'latin-squares'].map((s) =>
      JSON.parse(read(`../../content/sections/${s}/questions.json`)).length,
    )
    assert.deepEqual(counts, [173, 175, 125])
    assert.ok(existsSync(new URL('../../app/module-a/[section]/practice/page.tsx', import.meta.url)))
    const practiceRunner = read('../../components/practice/practice-runner.tsx')
    assert.ok(!practiceRunner.toLowerCase().includes('gam'), 'the Core runner knows about GAM')
  })
})
