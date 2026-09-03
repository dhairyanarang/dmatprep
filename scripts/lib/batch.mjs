/**
 * The append-only, slot-based generation driver.
 *
 * Every generation slot is addressed by `(section, tier, batchId, index)` and
 * draws from its own stream, seeded by hashing those coordinates. Rejection
 * sampling walks an `attempt` dimension rather than advancing a shared stream,
 * so:
 *
 *   - slot 7's candidate does not depend on how many candidates slots 1-6 tried;
 *   - enlarging a batch adds slots and changes none of the earlier ones;
 *   - a future batch cannot perturb any earlier batch at all.
 *
 * The old runner shared one stream per section, which is why a five-item quota
 * bump mutated 34/45, 36/45 and 40/45 items under their existing ids.
 *
 * Structural diversity is enforced against the existing bank *plus the accepted
 * prefix of this batch*, never against later slots — that ordering is what keeps
 * "grow the batch" a pure extension.
 */
import { itemId, itemSeed, seedCoordinates } from './seed.mjs'
import { makeRng } from './rng.mjs'
import { fingerprintFor, MAX_PER_FINGERPRINT, MAX_PER_FAMILY } from './fingerprint.mjs'
import { verifyQuestion } from './verify.mjs'

export const DEFAULT_MAX_ATTEMPTS = 4000

/**
 * @param build  (rng, difficulty, ctx) => question | null. Must not set `id` or
 *               `generator`; the driver owns both so ids stay batch-scoped.
 */
export function generateBatch({
  section,
  prefix,
  generatorName,
  version,
  batchId,
  quotas,
  build,
  existing = [],
  config = {},
  verifiedAt,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  onReject,
  slotTargets = {},
}) {
  const accepted = []
  const stats = { attempted: 0, builtNull: 0, contractRejected: 0, duplicateRejected: 0, verifyRejected: 0 }

  // Two caps doing two different jobs.
  //
  // The *fingerprint* cap is the anti-duplication gate and counts the existing
  // bank: a new batch must not re-tread a structure already covered. The
  // *family* cap is a within-batch spread heuristic — it stops one batch being
  // monotone — and deliberately counts only this batch.
  //
  // Seeding the family cap from the existing bank was measured to make
  // legitimate generation impossible: the legacy bank is itself structurally
  // concentrated (Mathematical Equations has 6 families across 45 items, with
  // one holding 15), so three families started at or above the cap and left a
  // new batch nowhere to go. Spec/Phase 18 is explicit that a uniqueness
  // threshold must not block legitimate generation. The strict per-fingerprint
  // cap against the full bank is untouched.
  const fingerprintCounts = new Map()
  const familyCounts = new Map()
  const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1)
  for (const q of existing) {
    try {
      bump(fingerprintCounts, fingerprintFor(q).key)
    } catch {
      // A legacy item whose kind we cannot fingerprint simply does not constrain.
    }
  }

  for (const [difficulty, count] of Object.entries(quotas)) {
    for (let index = 0; index < count; index++) {
      let placed = null

      for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
        stats.attempted++
        const coordinates = { generator: generatorName, section, tier: difficulty, batchId, index, attempt }
        const seed = itemSeed(coordinates)
        const rng = makeRng(seed)

        // A slot may carry a coverage target from the generation plan — "this
        // slot should attempt a bare pin", "this one should use four symbols".
        // Targets steer *which documented structure is attempted*; they never
        // relax a gate. A targeted candidate passes exactly the same checks as
        // an untargeted one, and a target that cannot be met validly simply
        // fails the slot rather than lowering the bar (spec §6, "gaps being
        // filled").
        const target = slotTargets[difficulty]?.[index] ?? null
        const candidate = build(rng, difficulty, { section, batchId, index, attempt, target })
        if (!candidate) {
          stats.builtNull++
          continue
        }

        candidate.id = itemId({ prefix, tier: difficulty, batchId, index })
        candidate.generator = {
          name: generatorName,
          version,
          batchId,
          seed,
          seedCoordinates: seedCoordinates({ section, tier: difficulty, batchId, index, attempt }),
          config,
          verifiedAt: verifiedAt ?? new Date().toISOString().slice(0, 10),
        }

        // Same verifier `verify-bank` runs. A candidate that would fail the bank
        // check must never reach the bank.
        const { errors } = verifyQuestion(candidate)
        if (errors.length) {
          stats.verifyRejected++
          onReject?.({ difficulty, index, attempt, reason: 'verify', errors })
          continue
        }

        const fp = fingerprintFor(candidate)
        if ((fingerprintCounts.get(fp.key) ?? 0) >= MAX_PER_FINGERPRINT) {
          stats.duplicateRejected++
          continue
        }
        if ((familyCounts.get(fp.familyKey) ?? 0) >= MAX_PER_FAMILY) {
          stats.duplicateRejected++
          continue
        }

        bump(fingerprintCounts, fp.key)
        bump(familyCounts, fp.familyKey)
        placed = candidate
      }

      if (!placed) {
        throw new Error(
          `${section}: could not fill ${difficulty} slot ${index + 1}/${count} of batch ${batchId} within ${maxAttempts} attempts. ` +
            `This is a capacity signal, not a bug — reduce the tier count or widen the allowed structures. ` +
            `Do not relax the gates to make it pass.`,
        )
      }
      accepted.push(placed)
    }
  }

  return { questions: accepted, stats }
}

/**
 * Rebuild one published item from its own stamp, to prove single-item
 * reproducibility. Returns the regenerated question for byte comparison.
 */
export function reproduceItem({ question, build, generatorName }) {
  const c = question.generator?.seedCoordinates
  if (!c) throw new Error(`${question.id} carries no seed coordinates`)
  const seed = itemSeed({ generator: generatorName, ...c })
  if (seed !== question.generator.seed) {
    throw new Error(`${question.id}: recomputed seed ${seed} does not match stamped ${question.generator.seed}`)
  }
  const rebuilt = build(makeRng(seed), c.tier, { section: c.section, batchId: c.batchId, index: c.index, attempt: c.attempt })
  if (!rebuilt) return null
  rebuilt.id = question.id
  rebuilt.generator = question.generator
  return rebuilt
}
