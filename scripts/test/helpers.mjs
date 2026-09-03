/**
 * Test helpers.
 *
 * As the bank fills, a tier's remaining headroom shrinks — the generator refuses
 * rather than emitting near-duplicates, which is the designed behaviour. Tests
 * that probe *invariance* (append-only, determinism, note accuracy) only need
 * some items to exist; they should not double as capacity assertions, or they
 * break every time the bank grows. This finds the largest quota that still
 * generates, at or below what was asked for.
 */
export function feasibleQuota(generate, existing, wanted, batchId = 'bFIT') {
  const quota = {}
  for (const [tier, want] of Object.entries(wanted)) {
    let n = want
    while (n > 0) {
      try {
        generate({ batchId, quotas: { low: 0, medium: 0, high: 0, [tier]: n }, existing, verifiedAt: '2026-09-03' })
        break
      } catch {
        n = Math.floor(n / 2)
      }
    }
    quota[tier] = n
  }
  return quota
}

/** Total items a quota asks for. */
export const quotaSize = (q) => Object.values(q).reduce((a, b) => a + b, 0)
