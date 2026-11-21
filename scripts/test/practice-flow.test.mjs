/**
 * The practice flow, and the exam modes it must not touch.
 *
 * Practice is a scrollable bank as of 9 September 2026: every question matching
 * the filter is on one page, choosing an option commits the answer, and the
 * detail opens beside the page rather than inside it. These assert the parts of
 * that which are easy to undo by accident — the confirm and next controls never
 * coming back, one attempt per answered question, the draft surviving a reload,
 * and the exam runners keeping their own behaviour.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
const runner = read('../../components/practice/practice-runner.tsx')
const panel = read('../../components/practice/solution-panel.tsx')
const feedback = read('../../components/practice/feedback-panel.tsx')
const view = read('../../components/practice/question-view.tsx')
const timed = read('../../components/practice/timed-runner.tsx')
const draft = read('../../lib/types/progress.ts')
const store = read('../../lib/progress/local-storage-store.ts')

describe('practice — the whole filtered bank on one page', () => {
  test('every question in the pool is rendered, not one at a time', () => {
    // `visible` is the pool after the status filter; the card still gets its
    // number from the pool, so filtering never renumbers a question.
    assert.match(runner, /visible\.map\(\(question\) => \(\s*<QuestionCard/, 'the pool is not mapped over')
    assert.match(
      runner,
      /position=\{pool\.indexOf\(question\) \+ 1\}/,
      'a filtered view renumbers the questions',
    )
    assert.ok(!/const question = pool\[index\]/.test(runner), 'a single-question cursor is back')
    assert.ok(!/\bsetIndex\b/.test(runner), 'the runner still tracks a current index')
  })

  test('offscreen cards are skipped for paint but stay in the page', () => {
    // content-visibility keeps 170-odd cards affordable without removing any
    // from the DOM, which is what makes "one scrollable page" literally true.
    assert.match(runner, /content-visibility:auto/, 'long banks would render everything eagerly')
    assert.match(runner, /contain-intrinsic-size/, 'the scrollbar would jump as cards resolve')
  })

  test('progress is a count, not a position', () => {
    assert.match(runner, /answered=\{answeredCount\}/)
    assert.match(runner, /total=\{pool\.length\}/)
  })

  test('the difficulty filter is kept', () => {
    assert.match(runner, /difficulty=\{filter as DifficultyFilter\}/)
    assert.match(runner, /onDifficulty=\{\(value\) => handleFilter\(value as Filter\)\}/)
    assert.match(runner, /questions\.filter\(\(q\) => q\.difficulty === filter\)/)
  })
})

describe('practice — choosing is answering', () => {
  test('there is no confirm control and no next control', () => {
    // Matched as rendered labels rather than as words: the file's own comment
    // explains what these buttons used to be, and that history is worth keeping.
    const labels = runner.replace(/\/\*[\s\S]*?\*\//g, '')
    assert.ok(!/Check answer/i.test(labels), 'the confirm step is back')
    assert.ok(!/Next question/i.test(labels), 'a next control is back')
    assert.ok(!/PracticeActionBar/.test(runner), 'the one-question action bar is back')
  })

  test('back navigation is gone, since scrolling replaces it', () => {
    assert.ok(!/\bgoTo\(/.test(runner), 'question-to-question navigation is back')
    assert.ok(!/>Back</.test(runner), 'a Back button is back')
  })

  test('the commit happens on the selection that completes the answer', () => {
    assert.match(
      runner,
      /requiredSelectionCount\(question\)\)\s*\{\s*commit\(question, next, current\.hintsUsed\)/,
      'selection no longer commits the answer',
    )
  })

  test('a multi-panel question waits for every panel', () => {
    // Figure Sequences needs two; committing on the first would file half an answer.
    assert.match(runner, /Object\.keys\(next\)\.length >= requiredSelectionCount\(question\)/)
  })

  test('an answered question can never be answered again', () => {
    assert.match(runner, /if \(current\.submitted\) return/, 'handleSelect has no re-entry guard')
  })

  test('the card shows a short reason, not the whole walkthrough', () => {
    assert.match(feedback, /export function FeedbackSummary/)
    assert.match(feedback, /question\.walkthrough\?\.keyInsight \?\? question\.explanation/)
    // The long form exists, and the card does not render it.
    assert.match(feedback, /export function FeedbackDetail/)
    assert.ok(!/FeedbackDetail/.test(runner), 'the card renders the long form inline')
  })
})

describe('practice — hints and the working open beside the page', () => {
  test('See more and the hint button both open the one panel', () => {
    assert.match(feedback, /See more/)
    assert.match(runner, /<SolutionPanel/)
    assert.match(runner, /setSelectedId\(question\.id\)/)
    // The hint trigger opens that same panel. It used to unfold a block inside
    // the card, which pushed every question below it down the page.
    assert.match(runner, /<HintTrigger[\s\S]{0,200}onOpen=\{onSeeMore\}/)
    assert.ok(!/<HintPanel/.test(runner), 'the inline hint block is back')
  })

  test('the panel names its question and can be closed', () => {
    assert.match(panel, /Q\{String\(position\)\.padStart\(2, '0'\)\}/)
    assert.match(panel, /aria-label="Close hints and solution"/)
    assert.match(panel, /event\.key === 'Escape'/, 'Escape does not close the drawer')
  })

  test('every hint slot is visible, and an unasked one says so', () => {
    // The prototype shows all three slots, so how much help exists is known
    // before any of it is spent.
    assert.match(panel, /Hidden until you ask/)
    assert.match(panel, /Show hint \{hintsUsed \+ 1\}/)
  })

  test('the working stays locked until the question is answered', () => {
    assert.match(panel, /Try it first\. The working opens once you answer\./)
    assert.match(panel, /\{answered \?/)
  })

  test('the panel steps between questions without closing', () => {
    assert.match(panel, /onStep\(-1\)/)
    assert.match(panel, /onStep\(1\)/)
    assert.match(runner, /onStep=\{stepTo\}/)
  })

  test('the panel is a drawer on a phone and a column on desktop', () => {
    // A 420px panel beside a question is unusable on a phone; an overlay on
    // desktop covers the very question it is explaining. `.spanel` is each of
    // those, by breakpoint.
    const css = read('../../app/globals.css')
    assert.match(
      css,
      /\.spanel \{[\s\S]*?position: fixed/,
      'the panel is not a drawer by default',
    )
    assert.match(
      css,
      /@media \(min-width: 1024px\) \{[\s\S]*?\.spanel \{[\s\S]*?position: sticky/,
      'the panel never becomes an in-flow column, so it overlaps the question on desktop',
    )
  })

  test('opening it records nothing and changes no answer', () => {
    // The only answer state it may touch is the hint count, which is what
    // asking for a hint means.
    assert.ok(!/recordAttempt/.test(panel), 'the panel records attempts')
    assert.ok(!/setAnswers/.test(panel), 'the panel mutates answers')
    assert.match(runner, /setSelectedId\(question\.id\)/)
  })

  test('it shows the existing detailed content unchanged', () => {
    assert.match(panel, /FeedbackDetail/)
    assert.match(feedback, /<SolutionViewer question=\{question\} defaultOpen \/>/)
    assert.match(feedback, /Why the other options are wrong/)
  })
})

describe('practice — figure sequences', () => {
  test('the answer options are drawn at the density of the sequence', () => {
    assert.match(view, /compactOptions \? 'max-w-\[6\.5rem\]' : undefined/)
    assert.match(view, /compactOptions \? 'p-1\.5' : 'p-2'/)
    assert.match(runner, /compactOptions/, 'practice does not ask for the compact sizing')
  })

  test('the compact sizing is opt-in, so the timed view is unchanged', () => {
    assert.match(view, /compactOptions\?: boolean/)
    assert.ok(!/compactOptions/.test(timed), 'the timed runner picked up the practice sizing')
  })

  test('the sequence is fixed cells that wrap, not a stretching grid', () => {
    // It was `grid-cols-3 sm:grid-cols-6`, which sized every matrix to a sixth
    // of whatever the column happened to be — so the figures grew with the page
    // and dominated the question. The prototype's `.fseq` is a wrapping flex row
    // of fixed 96px cells with a 12px gap; 76px below `sm` keeps all six legible
    // on a phone without a sideways scroll.
    assert.match(view, /flex flex-wrap gap-3/, 'the sequence is not a wrapping row')
    assert.match(view, /w-\[76px\] max-w-none sm:w-24/, 'the fixed cell size went away')
    assert.ok(
      !/sm:grid-cols-6/.test(view),
      'the stretching six-column grid is back',
    )
  })

  test('the figures themselves are untouched', () => {
    // Sizing is a CSS width on the <svg>. The viewBox, the cell geometry and
    // the answer wiring must not move with it.
    assert.match(view, /image\.correctOptionId/, 'the answer key wiring changed')
    const matrix = read('../../components/render/figure-matrix.tsx')
    assert.match(matrix, /const CELL = 100/, 'the drawing grid changed size')
    assert.match(matrix, /viewBox=\{`\$\{-PAD\} \$\{-PAD\}/, 'the viewBox changed')
  })
})

describe('practice — nothing is lost on reload', () => {
  test('answers are held per question, not per position', () => {
    assert.match(runner, /answers\[question\.id\]/, 'answers are not keyed by question')
    assert.match(draft, /answered\?: Record<string, PracticeAnswer>/, 'the draft cannot carry them')
  })

  test('the draft still writes the legacy single-question fields', () => {
    // A draft written here has to restore in a build that predates the change,
    // so the legacy fields point at the first unanswered question.
    assert.match(runner, /index: nextUp,/)
    for (const field of ['selection: legacy.selection', 'hintsUsed: legacy.hintsUsed', 'submitted: legacy.submitted']) {
      assert.ok(runner.includes(field), `the draft stopped writing ${field}`)
    }
    assert.match(runner, /answered: answers,/, 'the draft stopped writing the history')
  })

  test('a draft saved before the history existed still restores its answer', () => {
    assert.match(runner, /const current = initialDraft\.questionIds\[initialDraft\.index\]/)
  })

  test('the store notices a history change', () => {
    assert.match(
      store,
      /Object\.keys\(a\.answered \?\? \{\}\)\.length === Object\.keys\(b\.answered \?\? \{\}\)\.length/,
      'a draft whose only change is the history would not be written',
    )
  })
})

describe('the exam modes are not practice', () => {
  test('the timed runner took none of this', () => {
    assert.ok(!/SolutionPanel/.test(timed), 'the practice side panel leaked into timed')
    assert.ok(!/FeedbackSummary/.test(timed), 'the practice card feedback leaked into timed')
    assert.ok(!/answered: answers/.test(timed), 'practice draft state leaked into timed')
  })

  test('timed still owns its clock and its own chrome', () => {
    assert.match(timed, /stageEndsAt|endsAt/, 'the timed runner lost its absolute deadline')
    // It used to share `PracticeActionBar` with practice. It no longer does:
    // a sitting is a takeover with its own dark header, clock and task
    // navigator, which is the point of this whole describe block — the exam
    // modes are not practice. Borrowing practice chrome again would be the
    // drift this guards against, so the assertion is that it has its own.
    assert.match(timed, /ExamChrome/, 'the timed runner lost its own exam chrome')
    assert.match(timed, /ExamClock/, 'the timed runner lost its clock')
    assert.match(timed, /TaskPanel/, 'the timed runner lost its task navigator')
    assert.ok(
      !/PracticeActionBar/.test(timed),
      'the practice action bar came back into the exam runner',
    )
  })

  test('only practice modes use the practice runner', () => {
    const page = read('../../app/module-a/[section]/practice/page.tsx')
    assert.match(page, /PracticeRunner/)
    const quick = read('../../components/practice/quick-launcher.tsx')
    assert.match(quick, /mode="quick"/, 'quick practice no longer declares its mode')
    assert.ok(!quick.includes('timing'), 'quick practice acquired a timer')
  })
})
