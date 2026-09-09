/**
 * The practice flow, and the exam modes it must not touch.
 *
 * Practice lost its confirm step on 9 September 2026: choosing an option is
 * answering, and a Back button was added so a learner can look at what they did
 * a moment ago. These assert the parts of that which are easy to undo by
 * accident — the separate submit never coming back, the exam runners keeping
 * their own behaviour, and an answer surviving a reload.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
const runner = read('../../components/practice/practice-runner.tsx')
const timed = read('../../components/practice/timed-runner.tsx')
const draft = read('../../lib/types/progress.ts')
const store = read('../../lib/progress/local-storage-store.ts')

describe('practice — choosing is answering', () => {
  test('there is no separate confirm control', () => {
    assert.ok(!/Check answer/i.test(runner), 'the confirm step is back in practice')
  })

  test('the commit happens on the selection that completes the answer', () => {
    assert.match(
      runner,
      /requiredSelectionCount\(question\)\)\s*commit\(next\)/,
      'selection no longer commits the answer',
    )
  })

  test('a multi-panel question waits for every panel', () => {
    // Figure Sequences needs two; committing on the first would file half an answer.
    assert.match(runner, /Object\.keys\(next\)\.length >= requiredSelectionCount\(question\)/)
  })

  test('an answer is committed once and cannot be committed again', () => {
    assert.match(runner, /if \(!question \|\| submitted\) return/, 'commit has no re-entry guard')
    // handleSelect bails on a submitted question, so a revisit cannot re-record.
    assert.match(runner, /const handleSelect[\s\S]{0,200}if \(!question \|\| submitted\) return/)
  })
})

describe('practice — going back', () => {
  test('the runner can move in both directions', () => {
    assert.match(runner, /goTo\(index - 1\)/, 'there is no way back')
    assert.match(runner, /goTo\(index \+ 1\)/, 'there is no way forward')
  })

  test('moving pins the question order so the deck cannot reshuffle', () => {
    assert.match(
      runner,
      /setRestoredOrder\(\(prev\) => prev \?\? pool\.map\(\(q\) => q\.id\)\)/,
      'stepping back could land on a different question than it left',
    )
  })

  test('answers are held per question, not per position', () => {
    assert.match(runner, /answers\[question\.id\]/, 'answers are not keyed by question')
    assert.match(draft, /answered\?: Record<string, PracticeAnswer>/, 'the draft cannot carry them')
  })
})

describe('practice — nothing is lost on reload', () => {
  test('the draft still writes the legacy single-question fields', () => {
    // A draft written here has to restore in a build that predates `answered`.
    for (const field of ['selection,', 'hintsUsed,', 'submitted,']) {
      assert.ok(runner.includes(field), `the draft stopped writing ${field}`)
    }
    assert.match(runner, /answered: answers,/, 'the draft stopped writing the history')
  })

  test('a draft saved before the history existed still restores its question', () => {
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
  test('timed keeps its own confirm-free submission and is untouched by this change', () => {
    assert.ok(!timed.includes('goTo('), 'practice navigation leaked into the timed runner')
    assert.ok(!timed.includes('answered: answers'), 'practice draft state leaked into timed')
  })

  test('timed still owns its clock', () => {
    assert.match(timed, /stageEndsAt|endsAt/, 'the timed runner lost its absolute deadline')
  })

  test('only practice modes use the practice runner', () => {
    const page = read('../../app/module-a/[section]/practice/page.tsx')
    assert.match(page, /PracticeRunner/)
    const quick = read('../../components/practice/quick-launcher.tsx')
    assert.match(quick, /mode="quick"/, 'quick practice no longer declares its mode')
    assert.ok(!quick.includes('timing'), 'quick practice acquired a timer')
  })
})
