#!/usr/bin/env node
/**
 * Retired. Full-bank regeneration is no longer a supported operation.
 *
 * This script used to rebuild all three banks from one seed. The Phase 3 audit
 * measured what that cost: enlarging the quotas by five mutated 34/45 Figure
 * Sequence, 36/45 Mathematical Equation and 40/45 Latin Square items **under
 * their existing ids**, because a single RNG stream per section advances once
 * per candidate and a quota change shifts everything after it.
 *
 * `CLAUDE.md` records that attempts are immutable and that question exposure is
 * tracked per id per context. An id whose content changes silently corrupts both
 * — every stored answer against `fs-low-003` would now refer to a question the
 * candidate never saw.
 *
 * Questions are added with `scripts/generate-batch.mjs`, which is append-only by
 * construction and refuses to write if any existing item would change.
 */
console.error(`
Full-bank regeneration has been removed.

  Adding questions:   node scripts/generate-batch.mjs --batch b2 --section <section> --low N --medium N --high N
  Verifying the bank: npm run verify:bank

Regenerating in place would rewrite existing questions under their existing ids,
which breaks stored attempts and exposure tracking. If you genuinely need to
rebuild a section from scratch, retire the old items first (scripts/lib/bank.mjs
exports retireQuestion) so their ids are never reused.
`)
process.exit(1)
