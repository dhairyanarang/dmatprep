#!/usr/bin/env node
/**
 * Render draft questions to a standalone HTML file for visual review.
 *
 * Deliberately not a route, not a component, and not aware of Next.js. A draft
 * must be lookable-at before it is approved, and the obvious way to do that —
 * drop it in the bank and open the practice page — would put unapproved
 * material into production content and the public build. This writes one
 * self-contained file instead, with every symbol drawn as inline SVG.
 *
 * Nothing it reads or writes is imported by the application. `npm run build`
 * cannot see it, which `scripts/test/draft-isolation.test.mjs` asserts.
 *
 *   node scripts/preview-drafts.mjs
 *   open drafts/pilot-2026-11-13/preview.html
 */
import { readFileSync, writeFileSync } from 'node:fs'

// Defaults to the November pilot; `--dir <path>` points it at another drafts
// folder so a later pilot reuses this renderer instead of copying it. A second
// copy of the SVG code would be a second thing to keep honest.
const dirArg = process.argv.indexOf('--dir')
const DIR =
  dirArg === -1
    ? new URL('../drafts/pilot-2026-11-13/', import.meta.url)
    : new URL(`${process.argv[dirArg + 1].replace(/\/?$/, '/')}`, `file://${process.cwd()}/`)
const read = (name) => JSON.parse(readFileSync(new URL(name, DIR), 'utf8'))
const readOptional = (name) => {
  try {
    return read(name)
  } catch {
    return null
  }
}

const INK = {
  orange: '#e8833a', yellow: '#e8c33a', pink: '#e06c9f',
  black: '#2a2d31', green: '#4ca96a', blue: '#4a7fd1',
}

/* ------------------------------------------------------------------ shapes */

function shapeSvg(shape, colour, rotation) {
  const fill = INK[colour] ?? '#888'
  const spin = `rotate(${rotation ?? 0} 0 0)`
  const body = {
    square: `<rect x="-11" y="-11" width="22" height="22" rx="2" fill="${fill}"/>`,
    circle: `<circle r="12" fill="${fill}"/>`,
    triangle: `<polygon points="0,-13 12,9 -12,9" fill="${fill}"/>`,
    diamond: `<polygon points="0,-13 13,0 0,13 -13,0" fill="${fill}"/>`,
    hexagon: `<polygon points="12,0 6,10 -6,10 -12,0 -6,-10 6,-10" fill="${fill}"/>`,
    cross: `<path d="M-11-4h7v-7h8v7h7v8h-7v7h-8v-7h-7z" fill="${fill}"/>`,
    arrow: `<polygon points="0,-13 10,4 3,4 3,12 -3,12 -3,4 -10,4" fill="${fill}"/>`,
  }[shape] ?? `<circle r="10" fill="${fill}"/>`
  return `<g transform="${spin}">${body}</g>`
}

/** A 4x4 matrix panel. Cells are zero-indexed in the data. */
function matrixSvg(panel, rows, cols, { highlight = false } = {}) {
  const S = 34
  const w = cols * S
  const h = rows * S
  const lines = []
  for (let r = 0; r <= rows; r++) lines.push(`<line x1="0" y1="${r * S}" x2="${w}" y2="${r * S}" stroke="#d8d4cc"/>`)
  for (let c = 0; c <= cols; c++) lines.push(`<line x1="${c * S}" y1="0" x2="${c * S}" y2="${h}" stroke="#d8d4cc"/>`)
  const syms = (panel.symbols ?? []).map(
    (s) => `<g transform="translate(${s.cell.col * S + S / 2} ${s.cell.row * S + S / 2})">${shapeSvg(s.shape, s.colour, s.rotation)}</g>`,
  )
  const frame = highlight
    ? `<rect x="-3" y="-3" width="${w + 6}" height="${h + 6}" rx="4" fill="none" stroke="#2f8f5b" stroke-width="2"/>`
    : ''
  return `<svg width="${w + 8}" height="${h + 8}" viewBox="-4 -4 ${w + 8} ${h + 8}">${frame}${lines.join('')}${syms.join('')}</svg>`
}

/** A 5x5 Latin square. `target` is ringed; revealed deduction cells are grey. */
function latinSvg(grid, target, reveal = {}) {
  const S = 38
  const n = grid.length
  const out = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const isTarget = target && r === target.row && c === target.col
      const given = grid[r][c]
      const shown = given ?? reveal[`${r},${c}`] ?? ''
      out.push(`<rect x="${c * S}" y="${r * S}" width="${S}" height="${S}" fill="${isTarget ? '#eaf5ee' : '#fff'}" stroke="#d8d4cc"/>`)
      if (isTarget) out.push(`<rect x="${c * S + 2}" y="${r * S + 2}" width="${S - 4}" height="${S - 4}" rx="3" fill="none" stroke="#2f8f5b" stroke-width="2"/>`)
      if (shown) {
        out.push(
          `<text x="${c * S + S / 2}" y="${r * S + S / 2 + 6}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="17" fill="${given ? '#2a2d31' : '#9b9792'}">${shown}</text>`,
        )
      }
    }
  }
  return `<svg width="${n * S + 2}" height="${n * S + 2}" viewBox="-1 -1 ${n * S + 2} ${n * S + 2}">${out.join('')}</svg>`
}

/* ------------------------------------------------------------------- build */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const parts = []

for (const q of read('_selected.json')) {
  parts.push(`<article><h2>${q.id} <span class="tag">${q.difficulty}</span> <span class="draft">DRAFT — UNAPPROVED</span></h2>`)

  if (q.kind === 'figure-sequence') {
    parts.push('<p class="lead">Four matrices are given. The fifth and sixth continue the sequence.</p>')
    parts.push('<div class="row">' + q.given.map((p, i) => `<figure>${matrixSvg(p, q.grid.rows, q.grid.cols)}<figcaption>Matrix ${i + 1}</figcaption></figure>`).join('') + '</div>')
    for (const [ix, img] of q.images.entries()) {
      parts.push(`<p class="lead">Options for matrix ${ix + 5} — the marked one is the key.</p>`)
      parts.push(
        '<div class="row">' +
          img.options
            .map((o) => `<figure>${matrixSvg(o.panel, q.grid.rows, q.grid.cols, { highlight: o.id === img.correctOptionId })}<figcaption>${o.id}${o.id === img.correctOptionId ? ' ✓' : ''}</figcaption></figure>`)
            .join('') +
          '</div>',
      )
    }
  }

  if (q.kind === 'latin-square') {
    const reveal = Object.fromEntries((q.solutionSteps ?? []).map((s) => [`${s.cell.row},${s.cell.col}`, s.letter]))
    parts.push(`<p class="lead">Each letter appears once per row and once per column. Ringed cell is the target. Grey letters are the deduction chain, shown for review only.</p>`)
    parts.push(`<div class="row"><figure>${latinSvg(q.grid, q.target)}<figcaption>as the candidate sees it · ${q.grid.flat().filter(Boolean).length} givens</figcaption></figure>` +
      `<figure>${latinSvg(q.grid, q.target, reveal)}<figcaption>with the chain · depth ${q.forcedPlacementDepth}</figcaption></figure></div>`)
    parts.push(`<p class="lead">Answer: <strong>${q.options.find((o) => o.id === q.correctOptionId).letter}</strong></p>`)
  }

  parts.push(`<p class="exp">${esc(q.explanation)}</p></article>`)
}

const gam = readOptional('gam-pilot.json')
if (gam) {
const gq = gam.questions[0]
parts.push(`<article><h2>${gq.id} <span class="tag">${gq.difficulty}</span> <span class="draft">DRAFT — UNAPPROVED</span></h2>`)
for (const b of gam.pack.blocks) {
  if (b.kind === 'heading') parts.push(`<h3>${esc(b.text)}</h3>`)
  else if (b.kind === 'paragraph') parts.push(`<p class="src"><span class="bid">${b.id}</span> ${esc(b.text)}</p>`)
  else if (b.kind === 'table') {
    parts.push(
      `<table><caption><span class="bid">${b.id}</span> ${esc(b.caption)}</caption><tr>${b.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>` +
        b.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') +
        '</table>',
    )
  }
}
parts.push(`<p class="lead"><strong>${esc(gq.stem)}</strong></p><ul class="opts">` +
  gq.options.map((o) => `<li class="${o.id === gq.correctOptionId ? 'ok' : ''}">(${o.id}) ${esc(o.text)}${o.id === gq.correctOptionId ? ' ✓' : ''}</li>`).join('') +
  `</ul><p class="exp">${esc(gq.explanation)}</p></article>`)
}

const html = `<!doctype html><meta charset="utf-8"><title>Pilot P1 — draft review</title><style>
body{font:15px/1.55 ui-sans-serif,system-ui;margin:0;padding:28px;background:#faf9f7;color:#2a2d31;max-width:980px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:0 0 10px;display:flex;gap:8px;align-items:center}
h3{font-size:15px;margin:14px 0 6px}
article{background:#fff;border:1px solid #e5e1d9;border-radius:10px;padding:18px 20px;margin:0 0 20px}
.row{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0 14px}
figure{margin:0;text-align:center}figcaption{font-size:11px;color:#8a8681;margin-top:4px}
.tag{font-size:11px;background:#f0ede7;border-radius:4px;padding:2px 7px;font-weight:500}
.draft{font-size:11px;color:#b4462f;border:1px solid #e9c4bb;background:#fdf3f1;border-radius:4px;padding:2px 7px}
.lead{margin:10px 0 6px}.exp{font-size:13px;color:#5c5852;border-top:1px solid #eee;padding-top:10px;margin-top:12px}
.src{font-size:13px;background:#fbfaf8;border-left:2px solid #e5e1d9;padding:6px 10px;margin:6px 0}
.bid{font:11px ui-monospace,monospace;color:#a09b94;margin-right:6px}
table{border-collapse:collapse;font-size:13px;margin:8px 0}caption{text-align:left;font-size:12px;color:#8a8681;padding-bottom:5px}
th,td{border:1px solid #e5e1d9;padding:4px 10px;text-align:left}th{background:#faf9f7;font-weight:510}
.opts{list-style:none;padding:0}.opts li{padding:3px 0}.opts .ok{font-weight:590;color:#2f8f5b}
.banner{background:#fdf3f1;border:1px solid #e9c4bb;border-radius:8px;padding:12px 16px;margin:0 0 20px;font-size:13px}
</style><h1>Pilot batch P1 — visual review</h1>
<div class="banner"><strong>DRAFT — UNAPPROVED, NOT FOR PUBLICATION.</strong> Rendered from <code>drafts/</code> by
<code>scripts/preview-drafts.mjs</code>. This file is not part of the application, is not a route, and does not
reach the production build. Answer keys are shown because this is an author-and-reviewer view, never a candidate one.
The three Mathematical Equations drafts are omitted: they are blocked by <code>ME_CONTRACT</code>.</div>
${parts.join('\n')}`

writeFileSync(new URL('preview.html', DIR), html)
console.log(`wrote ${new URL('preview.html', DIR).pathname}`)
