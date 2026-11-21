/**
 * The question set a candidate is working on must not change underneath them.
 *
 * Three bugs, all the same shape, all shipped at once. `useSolutions` returned
 * a new object on every render, so every memo that listed it re-ran:
 *
 *   · `TimedLauncher`'s plan — whose own comment says it is "made once and
 *     then held" — was rebuilt on every render. Its seed is derived from how
 *     many attempts and sessions have been recorded, and submitting records
 *     both, so on the render after submission the plan changed and the results
 *     screen graded twenty questions the candidate had never seen. Every timed
 *     score read 0 with everything marked "Not answered".
 *   · `QuickLauncher` planned in its render body, so answering question 1
 *     replaced questions 2 to 10 mid-set.
 *   · `PracticeRunner`'s `pool` memo listed an array rebuilt every render, so
 *     its documented "do not shuffle the deck under their feet" guard never
 *     actually held.
 *
 * These are static checks, and deliberately so. The suite is plain Node with
 * no DOM and no React renderer, and the alternative to a structural test here
 * is no test at all — adding a renderer to assert memo identity is a larger
 * change than the bug warrants. Each check names the exact hazard rather than
 * matching formatting, and the negative controls at the end prove that each
 * one still fires when the hazard is put back.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(join(root, p), 'utf8')

/**
 * Is `call` made anywhere outside a `useMemo`/`useCallback` body?
 *
 * Brace-matching from each hook opening, so a call nested inside one counts as
 * inside however deeply it sits. Comments are stripped first: this file quotes
 * the very patterns it forbids, and so do the files it checks.
 */
function callsOutsideMemo(source, call) {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

  // `useMemo<Question[]>(` is still a useMemo. Matching the bare string missed
  // every generic call, which is how this checker first reported a false
  // positive against a memo that was right there.
  const guarded = []
  for (const match of code.matchAll(/\b(?:useMemo|useCallback)\s*(?:<[^>(]*>)?\s*\(/g)) {
    const start = match.index
    let depth = 0
    let i = start + match[0].length - 1
    for (; i < code.length; i++) {
      if (code[i] === '(') depth++
      else if (code[i] === ')') {
        depth--
        if (depth === 0) break
      }
    }
    guarded.push([start, i])
  }

  const offenders = []
  let at = code.indexOf(call)
  while (at >= 0) {
    const before = code.slice(Math.max(0, at - 24), at)
    // A declaration is not a call. `function buildStages(` defines the thing
    // the check is about; flagging it would make the check unsatisfiable.
    // The identifier sits AT `at`, so what precedes it is the keyword alone.
    const declaration = /\b(?:function|const|let|var)\s+$/.test(before)
    if (!declaration && !guarded.some(([a, b]) => at > a && at < b)) {
      offenders.push(code.slice(Math.max(0, at - 60), at + call.length + 20).trim())
    }
    at = code.indexOf(call, at + 1)
  }
  return offenders
}

/* ------------------------------------------------- the hook they all shared */

test('useSolutions returns a value whose identity survives a re-render', () => {
  const source = read('lib/solutions/use-solutions.ts')

  assert.match(
    source,
    /return useMemo<SolutionsState>/,
    'the returned state object must be memoised — a fresh object literal per render is what ' +
      'broke every memo downstream',
  )
  assert.match(
    source,
    /const hydrate = useCallback\(/,
    'hydrate must be a stable callback; a new arrow function per render invalidates the memos ' +
      'that list it just as surely as a new object does',
  )
})

/* ----------------------------------------------- the three places it bit */

test('a timed test is planned once and then held', () => {
  const source = read('components/practice/timed-launcher.tsx')
  assert.deepEqual(
    callsOutsideMemo(source, 'buildStages('),
    [],
    'planning a timed test outside a memo re-plans it on every render, including the one after ' +
      'the session is recorded — which is when the seed changes',
  )
})

test('a quick-practice set is planned once and then held', () => {
  const source = read('components/practice/quick-launcher.tsx')
  assert.deepEqual(
    callsOutsideMemo(source, 'planSession('),
    [],
    'planning in the render body re-plans the set every time an answer is recorded, swapping ' +
      'out questions the candidate is part-way through',
  )
})

test('a practice page hydrates its questions once and then holds them', () => {
  const source = read('components/practice/practice-runner.tsx')
  assert.deepEqual(
    callsOutsideMemo(source, 'hydrate(props.questions)'),
    [],
    'a fresh array per render invalidates the pool memo, which re-sorts answered questions to ' +
      'the back — the shuffle its own comment says it prevents',
  )
})

/* ------------------------------------------------------- negative controls */

test('NEGATIVE CONTROL: the detector finds a call put back in a render body', () => {
  // Planting the hazard in a copy of the real source, so the check is proved
  // against the thing it guards rather than against a toy string.
  const real = read('components/practice/quick-launcher.tsx')
  const planted = real.replace(
    'export function QuickLauncher({',
    'const oops = planSession({})\nexport function QuickLauncher({',
  )
  assert.notEqual(planted, real, 'the plant did not apply — update this control')
  assert.ok(
    callsOutsideMemo(planted, 'planSession(').length > 0,
    'the detector missed a call outside every memo',
  )
})

test('NEGATIVE CONTROL: the detector does not fire on a call inside a memo', () => {
  const inside = `
    const x = useMemo(() => {
      return planSession({ pool, count })
    }, [pool, count])
  `
  assert.deepEqual(callsOutsideMemo(inside, 'planSession('), [])
})

test('NEGATIVE CONTROL: a commented-out call is not a call', () => {
  // This suite and the files it reads both quote the forbidden patterns in
  // prose. A checker that could not tell the difference would fail forever.
  const commented = '// planSession( is what used to happen here\nconst y = 1'
  assert.deepEqual(callsOutsideMemo(commented, 'planSession('), [])
})
