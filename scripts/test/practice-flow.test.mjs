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
const sheet = read('../../components/practice/explanation-sheet.tsx')
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

describe('practice — the detail opens beside the page', () => {
  test('See more opens a panel rather than expanding the card', () => {
    assert.match(feedback, /See more/)
    assert.match(runner, /<ExplanationSheet/)
    assert.match(runner, /setDetailId\(question\.id\)/)
  })

  test('the panel names its question and can be closed', () => {
    assert.match(sheet, /Question \{position\}/)
    assert.match(sheet, /onOpenChange=\{\(open\) => !open && onClose\(\)\}/)
  })

  test('the desktop panel is wide enough to read a walkthrough in', () => {
    // It sat at 384px for a while because the primitive's own
    // `data-[side=right]:sm:max-w-sm` outranked a bare `sm:` utility. The
    // override has to carry the data attribute or the width silently reverts.
    assert.match(
      sheet,
      /sm:data-\[side=right\]:max-w-\[min\(768px,60vw\)\]/,
      'the desktop panel width would lose to the primitive and fall back to 384px',
    )
  })

  test('it becomes a bottom sheet on a narrow screen', () => {
    assert.match(sheet, /max-sm:data-\[side=right\]:bottom-0/, 'a phone would get a side drawer')
    assert.match(sheet, /max-sm:data-\[side=right\]:h-\[85dvh\]/)
    assert.match(sheet, /max-sm:data-\[side=right\]:w-full/)
    // Every phone override has to carry the data attribute as well as the
    // breakpoint: the primitive sizes by `data-[side=right]`, so a bare
    // `max-sm:` utility loses on specificity and the sheet stays a narrow
    // column. That is a real bug this caught once already.
    const phoneOverrides = sheet.match(/'max-sm:[^']+'/g) ?? []
    assert.ok(phoneOverrides.length > 0, 'the phone treatment has gone')
    for (const line of phoneOverrides) {
      for (const cls of line.replace(/'/g, '').split(/\s+/)) {
        assert.match(
          cls,
          /^max-sm:data-\[side=right\]:/,
          `${cls} will lose to the primitive's own data-[side] rule`,
        )
      }
    }
  })

  test('opening it records nothing and changes no answer', () => {
    // The only state it touches is which question is open.
    assert.ok(!/recordAttempt/.test(sheet), 'the panel records attempts')
    assert.ok(!/setAnswers|patch\(/.test(sheet), 'the panel mutates answers')
    assert.match(runner, /onSeeMore=\{\(\) => setDetailId\(question\.id\)\}/)
  })

  test('it shows the existing detailed content unchanged', () => {
    assert.match(sheet, /FeedbackDetail/)
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

  test('the grid, the panels and the answer logic are untouched', () => {
    assert.match(view, /grid-cols-3 gap-2 sm:grid-cols-6/, 'the sequence layout changed')
    assert.match(view, /image\.correctOptionId/, 'the answer key wiring changed')
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
    assert.ok(!/ExplanationSheet/.test(timed), 'the practice side panel leaked into timed')
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
