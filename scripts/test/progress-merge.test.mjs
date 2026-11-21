/**
 * Reconciling a guest's progress with an account's.
 *
 * This is the one journey where a bug costs a candidate work they have already
 * done, and it had no tests at all. It also cannot be exercised end to end
 * without signing in to the live Supabase project and creating a real user
 * record, which this sprint was instructed not to do — so the logic is tested
 * directly here, and the limitation is recorded in the QA report rather than
 * papered over with a browser run that never happened.
 *
 * The merge strategy is decided by the KIND of record, which is what these
 * assertions pin down:
 *
 *   attempts, sessions   union by id — statements about something that
 *                        happened, so neither side may drop the other's
 *   exposure             per (question, context): max timesSeen, earliest
 *                        first, latest last — never a sum, because a row that
 *                        has already synced would be counted twice
 *   activeSession        last write wins on updatedAt
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  mergeActiveSession,
  mergeAttempts,
  mergeExposure,
  mergeSessions,
} from '../../lib/progress/merge.ts'

const attempt = (id, at, extra = {}) => ({ id, at, questionId: `q-${id}`, correct: true, ...extra })

/* --------------------------------------------------------------- attempts */

test('a guest signing in keeps every attempt from both sides', () => {
  const local = [attempt('a', '2026-11-01T10:00:00Z'), attempt('b', '2026-11-02T10:00:00Z')]
  const cloud = [attempt('c', '2026-11-03T10:00:00Z')]
  const merged = mergeAttempts(local, cloud)
  assert.deepEqual(merged.map((a) => a.id), ['a', 'b', 'c'], 'an attempt was dropped or reordered')
})

test('syncing the same attempt twice does not count it twice', () => {
  // Every push is an upsert and every attempt carries a client-minted id, so a
  // retry after a dropped connection must be a no-op rather than a duplicate.
  const one = attempt('a', '2026-11-01T10:00:00Z')
  const merged = mergeAttempts([one], [structuredClone(one)])
  assert.equal(merged.length, 1, 'a retried push duplicated an attempt')
})

test('a duplicate id resolves to one record, not two halves of one', () => {
  // Attempts are immutable and there is no UPDATE policy on the table, so the
  // two sides are the same record whenever the ids match. The merge must not
  // invent a third.
  const local = attempt('a', '2026-11-01T10:00:00Z', { correct: true })
  const cloud = attempt('a', '2026-11-01T10:00:00Z', { correct: false })
  const merged = mergeAttempts([local], [cloud])
  assert.equal(merged.length, 1)
  assert.ok([true, false].includes(merged[0].correct), 'the merged record is not one of the two inputs')
})

test('merging is order-independent for attempts', () => {
  const a = [attempt('a', '2026-11-01T10:00:00Z')]
  const b = [attempt('b', '2026-11-02T10:00:00Z')]
  assert.deepEqual(
    mergeAttempts(a, b).map((x) => x.id),
    mergeAttempts(b, a).map((x) => x.id),
    'which side is called local changes the result',
  )
})

test('an empty side never erases the other', () => {
  const local = [attempt('a', '2026-11-01T10:00:00Z')]
  assert.equal(mergeAttempts(local, []).length, 1, 'an empty cloud erased local work')
  assert.equal(mergeAttempts([], local).length, 1, 'an empty local erased cloud work')
})

/* --------------------------------------------------------------- exposure */

test('exposure takes the larger count rather than summing it', () => {
  const row = (times, first, last) => [
    { questionId: 'q1', context: 'practice', timesSeen: times, firstSeenAt: first, lastSeenAt: last },
  ]
  const merged = mergeExposure(
    row(3, '2026-11-01T10:00:00Z', '2026-11-05T10:00:00Z'),
    row(2, '2026-10-30T10:00:00Z', '2026-11-03T10:00:00Z'),
  )
  assert.equal(merged.length, 1)
  assert.equal(merged[0].timesSeen, 3, 'summing would double-count an already-synced row')
  assert.equal(merged[0].firstSeenAt, '2026-10-30T10:00:00Z', 'the earlier first-seen was lost')
  assert.equal(merged[0].lastSeenAt, '2026-11-05T10:00:00Z', 'the later last-seen was lost')
})

test('exposure is tracked per context, so pools never consume each other', () => {
  const merged = mergeExposure(
    [{ questionId: 'q1', context: 'practice', timesSeen: 1, firstSeenAt: 'a', lastSeenAt: 'a' }],
    [{ questionId: 'q1', context: 'mock', timesSeen: 1, firstSeenAt: 'a', lastSeenAt: 'a' }],
  )
  assert.equal(merged.length, 2, 'a question met in practice was treated as met in a mock')
})

/* ---------------------------------------------------------- active session */

test('the device that wrote most recently owns the active session', () => {
  const older = { id: 's1', updatedAt: '2026-11-01T10:00:00Z' }
  const newer = { id: 's2', updatedAt: '2026-11-02T10:00:00Z' }
  assert.equal(mergeActiveSession(older, newer).id, 's2')
  assert.equal(mergeActiveSession(newer, older).id, 's2')
})

test('a session in progress on one side survives a null on the other', () => {
  const live = { id: 's1', updatedAt: '2026-11-01T10:00:00Z' }
  assert.equal(mergeActiveSession(live, null).id, 's1', 'signing in discarded a mock in progress')
  assert.equal(mergeActiveSession(null, live).id, 's1')
  assert.equal(mergeActiveSession(null, null), null)
})

/* ---------------------------------------------------------------- sessions */

test('completed sessions union by id and stay in time order', () => {
  const s = (id, at) => ({ id, at, mode: 'mock' })
  const merged = mergeSessions([s('b', '2026-11-02T10:00:00Z')], [s('a', '2026-11-01T10:00:00Z')])
  assert.deepEqual(merged.map((x) => x.id), ['a', 'b'])
})

/* -------------------------------------------------------- the whole journey */

test('a guest with work, signing into an account with work, loses nothing', () => {
  const guest = {
    attempts: [attempt('g1', '2026-11-01T10:00:00Z'), attempt('g2', '2026-11-02T10:00:00Z')],
    exposure: [{ questionId: 'q1', context: 'practice', timesSeen: 2, firstSeenAt: 'a', lastSeenAt: 'c' }],
  }
  const account = {
    attempts: [attempt('c1', '2026-10-01T10:00:00Z')],
    exposure: [{ questionId: 'q1', context: 'practice', timesSeen: 1, firstSeenAt: 'b', lastSeenAt: 'b' }],
  }

  const attempts = mergeAttempts(guest.attempts, account.attempts)
  assert.equal(attempts.length, 3, 'the merge lost an attempt')
  assert.deepEqual(attempts.map((a) => a.id), ['c1', 'g1', 'g2'], 'attempts are not in time order')

  // And doing it twice — a retry after a dropped connection — changes nothing.
  const again = mergeAttempts(attempts, account.attempts)
  assert.deepEqual(again.map((a) => a.id), attempts.map((a) => a.id), 'a second merge was not idempotent')

  const exposure = mergeExposure(guest.exposure, account.exposure)
  assert.equal(exposure.length, 1)
  assert.equal(exposure[0].timesSeen, 2, 'exposure was summed across a sync')
})
