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
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
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

const fresh = [...new Set(gramHashes(raw))]
const out = new URL('../../content/gam/official-ngram-hashes.json', import.meta.url)

/**
 * The source is an argument, not a constant. It was hardcoded to the
 * 04.08.2026 build, so the corpus kept claiming that provenance no matter what
 * it was actually built from — the same "asserted rather than derived" defect
 * the provenance work found in the question bank.
 */
const sourceArg = process.argv.find((a) => a.startsWith('--source='))
if (!sourceArg) {
  console.error('usage: node scripts/gam/build-ngram-corpus.mjs <text-file> --source=<url> [--merge]')
  console.error('  --source is required: a corpus that cannot say what it came from cannot be audited.')
  process.exit(1)
}
const source = sourceArg.slice('--source='.length)

/**
 * `--merge` keeps the hashes already recorded and adds these.
 *
 * The right default for an originality gate: a superseded build is still
 * official, still copyrighted text, and a question that reproduces a line the
 * August PDF carried is no more original for that line having been reflowed in
 * September. Merging can only make the gate stricter.
 */
const merge = process.argv.includes('--merge')
const previous = merge && existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null
const sources = [...new Set([...(previous?.sources ?? (previous?.source ? [previous.source] : [])), source])]
const hashes = [...new Set([...(previous?.hashes ?? []), ...fresh])].sort()

writeFileSync(
  out,
  `${JSON.stringify(
    {
      note:
        `Truncated SHA-256 hashes of normalised ${N}-grams from the official g.a.s.t. dMAT ` +
        'General Academic Module preparatory materials. Hashes only — the source text is ' +
        'copyrighted and is never committed. Used by the originality gate. Covers every ' +
        'build listed in `sources`: a superseded build is still official text, so merging ' +
        'can only make the gate stricter.',
      sources,
      n: N,
      count: hashes.length,
      hashes,
    },
    null,
    0,
  )}\n`,
)
console.log(`wrote ${hashes.length} hashed ${N}-grams from ${sources.length} build(s); ${fresh.length} in this one`)
