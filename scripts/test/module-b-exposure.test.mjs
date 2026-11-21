/**
 * Module B must not hand over its answers before it is asked to mark.
 *
 * `/module-b/timed` is a statically prerendered page, and it used to receive
 * the full pack records as props. Server-to-client props are serialised into
 * the payload, so the page shipped all nineteen `correctOptionId`s and all
 * nineteen explanations in its own HTML: an anonymous `curl` — no session, no
 * question answered — returned the complete answer key. The five
 * `/module-b/practice/<pack>` pages did the same with three or four each.
 *
 * The fix serves `getPublicPacks()` and moves the answer half behind
 * `POST /api/module-b/mark`. These gates are what stop it coming back.
 *
 * Two of them read the source and always run. The third reads the build and
 * skips without one, exactly as `content-exposure.test.mjs` does, so a local
 * `npm test` is not a lie either way.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const BUILD = join(root, '.next/server/app')
const hasBuild = existsSync(BUILD)
const read = (p) => readFileSync(join(root, p), 'utf8')

/**
 * Every field on a GAM question that answers it.
 *
 * `computation` is the one that hides: `computation.expected` is the numeric
 * answer in a field whose name does not say so. `supportSpans` quotes the
 * lines the key rests on.
 */
const GAM_ANSWER_KEYS = [
  'correctOptionId',
  'explanation',
  'refutations',
  'supportSpans',
  'computation',
]

function countKeys(text) {
  const per = {}
  let total = 0
  for (const key of GAM_ANSWER_KEYS) {
    // Both the raw JSON form and the escaped form React uses inside the
    // flight payload embedded in HTML.
    const n =
      text.split(`"${key}\\"`).length - 1 + (text.split(`"${key}":`).length - 1)
    if (n > 0) {
      per[key] = n
      total += n
    }
  }
  return { per, total }
}

function moduleBPayloads() {
  const out = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) {
        if (name === 'cache') continue
        walk(full)
      } else if (/\.(html|rsc)$/.test(name) && full.includes('module-b')) {
        out.push(full)
      }
    }
  }
  if (hasBuild) walk(BUILD)
  return out
}

/* --------------------------------------------------------- source guards */

test('the GAM solution-key list covers every answer-bearing field', () => {
  const registry = read('lib/gam/registry.ts')
  const at = registry.indexOf('GAM_SOLUTION_KEYS = [')
  assert.ok(at !== -1, 'GAM_SOLUTION_KEYS not found — the strip cannot be checked')
  const listed = [...registry.slice(at, registry.indexOf(']', at)).matchAll(/'([^']+)'/g)].map(
    (m) => m[1],
  )
  assert.deepEqual(
    [...listed].sort(),
    [...GAM_ANSWER_KEYS].sort(),
    'the registry strips a different set of fields than this gate considers answer-bearing',
  )
})

/**
 * What `files={…}` resolves to, following one level of local assignment.
 *
 * The timed page passes a call directly; the practice page passes `[file]`,
 * bound further up. A gate that only read the JSX would have accepted the
 * second however it was built, which is the case that actually leaked.
 */
function resolveFilesExpression(source) {
  const passed = /files=\{([^}]+)\}/.exec(source)
  if (!passed) return null
  const expression = passed[1].trim().replace(/^\[|\]$/g, '').trim()
  if (expression.includes('(')) return expression

  // The binding NEAREST ABOVE the usage, not the first in the file. The
  // practice page has two `const file =` lines — one in `generateMetadata`,
  // which reads the title on the server and is perfectly entitled to the full
  // record, and one in the component. Taking the first found the wrong one and
  // failed a page that was already correct.
  const before = source.slice(0, passed.index)
  const matches = [...before.matchAll(new RegExp(`const\\s+${expression}\\s*=\\s*([^\n]+)`, 'g'))]
  const nearest = matches[matches.length - 1]
  return nearest ? nearest[1].trim() : expression
}

test('the runner pages serve stripped packs, never the full records', () => {
  for (const page of ['app/module-b/timed/page.tsx', 'app/module-b/practice/[pack]/page.tsx']) {
    const resolved = resolveFilesExpression(read(page))
    assert.ok(resolved, `${page}: could not find what is passed to the runner`)
    assert.match(
      resolved,
      /getPublicPacks?\(/,
      `${page} passes ${resolved} to the runner — that carries answers into the page`,
    )
  }
})

test('the marking route refuses to be cached', () => {
  const route = read('app/api/module-b/mark/route.ts')
  assert.match(route, /force-dynamic/, 'the marking route must not be statically rendered')
  assert.match(route, /no-store/, 'the marking response must not be cached')
})

/* ---------------------------------------------------------- build gates */

test('no built Module B payload carries an answer', { skip: !hasBuild }, () => {
  const offenders = []
  for (const file of moduleBPayloads()) {
    const { per, total } = countKeys(readFileSync(file, 'utf8'))
    if (total > 0) offenders.push(`${file.slice(root.length)} ${JSON.stringify(per)}`)
  }
  assert.deepEqual(
    offenders,
    [],
    `Module B payloads carrying answer content:\n  ${offenders.join('\n  ')}`,
  )
})

test('NEGATIVE CONTROL: the scanner detects a planted answer', () => {
  // Both encodings, because a gate that only recognised one would have passed
  // happily while the HTML form leaked.
  const plantedJson = '{"id":"q1","correctOptionId":"b","explanation":"because"}'
  const plantedHtml = '<html>{\\"id\\":\\"q1\\",\\"correctOptionId\\":\\"b\\"}</html>'

  const json = countKeys(plantedJson)
  assert.equal(json.total, 2, 'the scanner missed a plain JSON answer key')

  const html = countKeys(plantedHtml)
  assert.ok(html.total > 0, 'the scanner missed an escaped answer key in HTML')
})

test('NEGATIVE CONTROL: a page passing full packs would be caught', () => {
  // Both shapes the real pages use, so the resolver is exercised the same way
  // the gate above exercises it.
  const direct = 'return <GamPackRunner files={getPacks()} mode="timed" />'
  const indirect = 'const file = getPack(pack)\nreturn <GamPackRunner files={[file]} />'

  for (const bad of [direct, indirect]) {
    const resolved = resolveFilesExpression(bad)
    assert.ok(resolved, 'the resolver found nothing to check')
    assert.doesNotMatch(
      resolved,
      /getPublicPacks?\(/,
      `the source guard would not notice: ${bad}`,
    )
  }

  // And it must still accept the good shapes, or the gate is vacuous.
  for (const good of [
    'return <GamPackRunner files={getPublicPacks()} />',
    'const file = getPublicPack(pack)\nreturn <GamPackRunner files={[file]} />',
  ]) {
    assert.match(resolveFilesExpression(good), /getPublicPacks?\(/, `rejected a good page: ${good}`)
  }
})
