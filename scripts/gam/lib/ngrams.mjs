/**
 * Originality checking by hashed n-grams.
 *
 * Spec §4.6 and §5.7: every GAM pack must be original prose. The obvious way to
 * check that is to diff our text against the official material — but `CLAUDE.md`
 * forbids committing the g.a.s.t. PDFs or their extracted text, and this
 * repository is public.
 *
 * So the corpus we commit contains **only truncated SHA-256 hashes of normalised
 * 8-grams**. A hash cannot be turned back into the sentence it came from, so no
 * copyrighted wording enters the repository, while an overlap of eight
 * consecutive words still gets caught. The corpus is rebuilt from a locally
 * fetched PDF with `scripts/gam/build-ngram-corpus.mjs`; the PDF itself never
 * leaves the scratchpad.
 */
import { createHash } from 'node:crypto'

export const N = 8

/**
 * Normalise before hashing so trivial reformatting cannot evade the check:
 * lowercase, strip everything that is not a letter, digit or space, collapse
 * whitespace. The official extraction is full of stray spacing ("ap plication"),
 * so hyphens and punctuation are removed rather than trusted.
 */
export function normalise(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const hashGram = (gram) => createHash('sha256').update(gram).digest('hex').slice(0, 16)

/** Every overlapping n-gram of the text, hashed. */
export function gramHashes(text, n = N) {
  const words = normalise(text).split(' ').filter(Boolean)
  const out = []
  for (let i = 0; i + n <= words.length; i++) {
    out.push(hashGram(words.slice(i, i + n).join(' ')))
  }
  return out
}

/**
 * Any n-gram of `text` that also appears in the corpus. Returns the offending
 * hashes and their position, never the source wording — there is none to return.
 */
export function overlaps(text, corpusSet, n = N) {
  const words = normalise(text).split(' ').filter(Boolean)
  const hits = []
  for (let i = 0; i + n <= words.length; i++) {
    const gram = words.slice(i, i + n).join(' ')
    const hash = hashGram(gram)
    // Our own wording is safe to report — it is what we wrote.
    if (corpusSet.has(hash)) hits.push({ index: i, hash, gram })
  }
  return hits
}
