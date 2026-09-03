/**
 * Bank I/O for append-only generation.
 *
 * The invariant this file exists to enforce: **an existing question is never
 * rewritten, and an id never changes meaning.** The Phase 3 audit measured the
 * old runner mutating 34/45, 36/45 and 40/45 items under their existing ids
 * simply because a quota changed. `CLAUDE.md` records that attempts are
 * immutable and exposure is tracked per question id per context, so a mutated id
 * silently corrupts both.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'

const bankUrl = (section) => new URL(`../../content/sections/${section}/questions.json`, import.meta.url)
const retiredUrl = (section) => new URL(`../../content/sections/${section}/retired.json`, import.meta.url)

export const SECTIONS = ['figure-sequences', 'mathematical-equations', 'latin-squares']

export const canonicalHash = (question) =>
  createHash('sha256').update(JSON.stringify(question)).digest('hex')

export function readBank(section) {
  return JSON.parse(readFileSync(bankUrl(section), 'utf8'))
}

/**
 * Retired items: kept, never served, and their ids permanently reserved.
 *
 * An id that once meant one question must never later mean another — otherwise a
 * stored attempt against `fs-medium-007` would silently re-point at unrelated
 * content.
 */
export function readRetired(section) {
  const url = retiredUrl(section)
  if (!existsSync(url)) return []
  return JSON.parse(readFileSync(url, 'utf8'))
}

export function writeRetired(section, entries) {
  writeFileSync(retiredUrl(section), `${JSON.stringify(entries, null, 2)}\n`)
}

/** Every id ever used by this section — active or retired. Never reassign one. */
export function reservedIds(section) {
  const ids = new Set()
  for (const q of readBank(section)) ids.add(q.id)
  for (const entry of readRetired(section)) ids.add(entry.question?.id ?? entry.id)
  return ids
}

/**
 * Append accepted items, refusing to touch anything already present.
 *
 * Throws rather than mutating: a generation bug must fail the run, not quietly
 * rewrite production data.
 */
export function appendToBank(section, newQuestions, { dryRun = false } = {}) {
  const existing = readBank(section)
  const before = existing.map(canonicalHash)
  const reserved = reservedIds(section)

  for (const q of newQuestions) {
    if (reserved.has(q.id)) {
      throw new Error(`refusing to append ${q.id}: that id is already used or retired in ${section}`)
    }
  }
  const batchIds = new Set()
  for (const q of newQuestions) {
    if (batchIds.has(q.id)) throw new Error(`batch contains ${q.id} twice`)
    batchIds.add(q.id)
  }

  const merged = [...existing, ...newQuestions]

  // Prove the prefix is untouched before anything reaches disk.
  const after = merged.slice(0, existing.length).map(canonicalHash)
  for (let i = 0; i < before.length; i++) {
    if (before[i] !== after[i]) {
      throw new Error(`append mutated existing item ${existing[i].id} — aborting without writing`)
    }
  }

  if (!dryRun) writeFileSync(bankUrl(section), `${JSON.stringify(merged, null, 2)}\n`)
  return { existingCount: existing.length, appended: newQuestions.length, total: merged.length }
}

/**
 * Retire an active item: move it out of the served bank into the archive, with a
 * reason. The id stays reserved forever.
 */
export function retireQuestion(section, id, reason, { dryRun = false } = {}) {
  const bank = readBank(section)
  const index = bank.findIndex((q) => q.id === id)
  if (index === -1) throw new Error(`cannot retire ${id}: not present in ${section}`)

  const [question] = bank.splice(index, 1)
  const retired = readRetired(section)
  if (retired.some((e) => (e.question?.id ?? e.id) === id)) {
    throw new Error(`${id} is already retired`)
  }
  retired.push({ id, retiredAt: new Date().toISOString().slice(0, 10), reason, question })

  if (!dryRun) {
    writeFileSync(bankUrl(section), `${JSON.stringify(bank, null, 2)}\n`)
    writeRetired(section, retired)
  }
  return { remaining: bank.length }
}

/** Snapshot of every active item's canonical hash, for regression proofs. */
export function snapshot(sections = SECTIONS) {
  const out = {}
  for (const section of sections) {
    out[section] = readBank(section).map((q) => ({ id: q.id, hash: canonicalHash(q) }))
  }
  return out
}

/**
 * Compare two snapshots. Returns the items that changed, vanished or appeared —
 * the check Phase 21 of the fix brief requires after every hypothetical batch.
 */
export function diffSnapshots(before, after) {
  const changed = []
  const removed = []
  const added = []

  for (const section of Object.keys(before)) {
    const beforeById = new Map(before[section].map((e) => [e.id, e.hash]))
    const afterById = new Map((after[section] ?? []).map((e) => [e.id, e.hash]))

    for (const [id, hash] of beforeById) {
      if (!afterById.has(id)) removed.push(`${section}/${id}`)
      else if (afterById.get(id) !== hash) changed.push(`${section}/${id}`)
    }
    for (const id of afterById.keys()) if (!beforeById.has(id)) added.push(`${section}/${id}`)
  }

  return { changed, removed, added, clean: changed.length === 0 && removed.length === 0 }
}
