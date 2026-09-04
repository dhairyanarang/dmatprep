#!/usr/bin/env node
/**
 * Build the originality corpus from a locally fetched official PDF.
 *
 *   node scripts/gam/build-ngram-corpus.mjs <extracted-text-file>
 *
 * Writes ONLY truncated hashes to content/gam/official-ngram-hashes.json. The
 * source text is never copied into the repository — see scripts/gam/lib/ngrams.mjs
 * and the copyright rule in CLAUDE.md.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { gramHashes, N } from './lib/ngrams.mjs'

const input = process.argv[2]
if (!input) {
  console.error('usage: node scripts/gam/build-ngram-corpus.mjs <extracted-text-file>')
  process.exit(1)
}

// Strip the page banners the extractor emits so they do not become "official" grams.
const raw = readFileSync(input, 'utf8')
  .split('\n')
  .filter((line) => !/^===== PAGE \d+ =====$/.test(line))
  .join(' ')

const hashes = [...new Set(gramHashes(raw))].sort()
const out = new URL('../../content/gam/official-ngram-hashes.json', import.meta.url)
writeFileSync(
  out,
  `${JSON.stringify(
    {
      note:
        'Truncated SHA-256 hashes of normalised 8-grams from the official g.a.s.t. dMAT ' +
        'General Academic Module preparatory materials (04.08.2026). Hashes only — the ' +
        'source text is copyrighted and is never committed. Used by the originality gate.',
      source: 'www.d-mat.de/wp-content/uploads/2026/08/260804_dMAT_General-Academic-Module_Preparatoy-Materials_EN.pdf',
      n: N,
      count: hashes.length,
      hashes,
    },
    null,
    0,
  )}\n`,
)
console.log(`wrote ${hashes.length} hashed ${N}-grams (no source text)`)
