/**
 * Seeded RNG (mulberry32).
 *
 * Generation is deterministic on purpose: re-running the generators with the
 * same seed reproduces the same bank byte for byte, so a regenerated
 * questions.json diffs cleanly and a reviewed item stays reviewed.
 */
export function makeRng(seed) {
  let a = seed >>> 0
  return function rng() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1))

export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)]

export function shuffle(rng, arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Deterministic stamp for generated items — never Date.now(). */
export const VERIFIED_AT = '2026-08-11'
