/**
 * The dates are facts about an exam, and they go out of date on a schedule.
 *
 * They did. The app counted down to 15 and 26 September 2026 for seven weeks
 * after both had passed, and a study plan went on offering "seven weeks to
 * Saturday 26 September 2026" from November. Nothing failed, because nothing
 * was checking. (That plan has since been removed as a feature; the gates it
 * prompted are what remain, and they apply to every date the product shows.)
 *
 * These gates are deliberately the kind that start failing with time. A build
 * that breaks in March 2027 saying every announced sitting has passed is the
 * correct outcome — it is the prompt to re-read d-mat.de, which is the only
 * place the answer exists.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(root + p, 'utf8')

const keyDates = read('content/exam/key-dates.ts')

/** [registrationDeadline, testDate, resultsDate] per cycle, in file order. */
function cycles() {
  return [...keyDates.matchAll(
    /registrationDeadline:\s*'(\d{4}-\d{2}-\d{2})',\s*testDate:\s*'(\d{4}-\d{2}-\d{2})',\s*resultsDate:\s*'(\d{4}-\d{2}-\d{2})'/g,
  )].map((m) => ({ registrationDeadline: m[1], testDate: m[2], resultsDate: m[3] }))
}

test('every cycle is internally ordered', () => {
  const all = cycles()
  assert.ok(all.length >= 1, 'no exam cycles found — the parser or the file shape changed')
  for (const c of all) {
    assert.ok(c.registrationDeadline < c.testDate, `${c.testDate}: registration closes after the test`)
    assert.ok(c.testDate < c.resultsDate, `${c.testDate}: results land before the test`)
  }
})

test('cycles are in chronological order', () => {
  const all = cycles()
  for (let i = 1; i < all.length; i++) {
    assert.ok(all[i - 1].testDate < all[i].testDate, 'EXAM_CYCLES is not in date order — nextCycle depends on it')
  }
})

test('at least one announced sitting is still ahead', () => {
  // Fails once every cycle has passed. That is the point: the fix is to read
  // d-mat.de/en/dmat-in-india and add the new cycle, never to relax this.
  const today = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const iso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  const upcoming = cycles().filter((c) => c.testDate >= iso)
  assert.ok(
    upcoming.length > 0,
    'Every announced dMAT sitting has passed. Re-read https://www.d-mat.de/en/dmat-in-india/ ' +
      'and add the new cycle to content/exam/key-dates.ts. Do not delete this test.',
  )
})

test('no user-facing copy still names a passed 2026 sitting as upcoming', () => {
  // The historical statements are fine and stay — "first sat on 26 September
  // 2026" is true. What must not survive is copy that presents a passed date as
  // something to prepare for.
  const surfaces = [
    'components/exam/checklist-items.tsx',
    'content/exam/key-dates.ts',
  ]
  for (const file of surfaces) {
    const src = read(file)
    assert.ok(
      !/closes 15 September 2026|to Saturday 26 September 2026/.test(src),
      `${file} still presents a 2026 date as upcoming`,
    )
  }
})
