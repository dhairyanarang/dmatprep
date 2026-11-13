/**
 * A worked example must point at a question that exists.
 *
 * `ContentBlocks` renders `null` when `getQuestion` misses, so a retired id
 * does not crash the build or fail a type check — it silently empties the
 * section and leaves a bare "Worked examples" heading on the page. That is
 * exactly what happened when the 02.09.2026 bank repair retired fs-low-001,
 * fs-medium-001 and me-low-001: three of the six worked examples on Module A
 * disappeared and nothing reported it.
 *
 * Retirement is append-only and permanent, so this can recur on any future
 * repair. The guide files are TypeScript, which the node test runner does not
 * load, so the ids are read out of the source text — coarse, but it is the
 * literal string the app resolves at runtime.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const SECTIONS = ['figure-sequences', 'mathematical-equations', 'latin-squares']

const root = new URL('../../content/sections/', import.meta.url)

test('every worked example in a guide resolves to a live question', () => {
  for (const section of SECTIONS) {
    const guide = readFileSync(new URL(`${section}/guide.ts`, root), 'utf8')
    const bank = JSON.parse(readFileSync(new URL(`${section}/questions.json`, root), 'utf8'))
    const live = new Set(bank.map((q) => q.id))

    const referenced = [...guide.matchAll(/questionId:\s*'([^']+)'/g)].map((m) => m[1])
    assert.ok(referenced.length > 0, `${section}: guide references no worked example`)

    for (const id of referenced) {
      assert.ok(
        live.has(id),
        `${section}: guide references ${id}, which is not in the bank — the worked ` +
          `example renders as nothing. Point it at a live question.`,
      )
    }
  }
})
