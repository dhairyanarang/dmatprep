#!/usr/bin/env node
/**
 * The visual review sheet for the static-rotator pilot.
 *
 *   node scripts/build-rotator-review.mjs
 *   open drafts/static-rotator-2026-11-14/review.html
 *
 * Shows each item as a reviewer needs to judge it: the rule in words, the
 * complete six-panel sequence with the keyed continuations in place, every
 * option with the key marked, and the result of each machine check beside the
 * thing it checked.
 *
 * Deliberately not a route and not aware of Next.js. These six items are NOT in
 * the bank and must not be until a person approves them.
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { disambiguationErrors, candidateMovements, candidateRotations, candidateColours } from './lib/fs-inversion.mjs'
import { verifyQuestion } from './lib/verify.mjs'

const DIR = new URL('../drafts/static-rotator-2026-11-14/', import.meta.url)
const questions = JSON.parse(readFileSync(new URL('_selected.json', DIR), 'utf8'))

const INK = { orange: '#e8833a', yellow: '#e8c33a', pink: '#e06c9f', black: '#2a2d31', green: '#4ca96a', blue: '#4a7fd1' }
const FACING = { 0: 'up', 90: 'right', 180: 'down', 270: 'left' }

function shapeSvg(shape, colour, rotation) {
  const fill = INK[colour] ?? '#888'
  const body =
    shape === 'triangle'
      ? `<polygon points="0,-13 12,9 -12,9" fill="${fill}"/>`
      : `<polygon points="0,-13 10,4 3,4 3,12 -3,12 -3,4 -10,4" fill="${fill}"/>`
  return `<g transform="rotate(${rotation ?? 0} 0 0)">${body}</g>`
}

function matrixSvg(panel, rows, cols, { highlight = false, ghost = false } = {}) {
  const S = 34
  const w = cols * S
  const h = rows * S
  const lines = []
  for (let r = 0; r <= rows; r++) lines.push(`<line x1="0" y1="${r * S}" x2="${w}" y2="${r * S}" stroke="#d8d4cc"/>`)
  for (let c = 0; c <= cols; c++) lines.push(`<line x1="${c * S}" y1="0" x2="${c * S}" y2="${h}" stroke="#d8d4cc"/>`)
  const syms = (panel.symbols ?? []).map(
    (s) =>
      `<g transform="translate(${s.cell.col * S + S / 2} ${s.cell.row * S + S / 2})" opacity="${ghost ? 0.45 : 1}">${shapeSvg(s.shape, s.colour, s.rotation)}</g>`,
  )
  const frame = highlight
    ? `<rect x="-3" y="-3" width="${w + 6}" height="${h + 6}" rx="4" fill="none" stroke="#2f8f5b" stroke-width="2"/>`
    : ''
  return `<svg width="${w + 8}" height="${h + 8}" viewBox="-4 -4 ${w + 8} ${h + 8}">${frame}${lines.join('')}${syms.join('')}</svg>`
}

/** How many distinct continuations the documented rule space allows. */
function continuationCount(q) {
  const errors = disambiguationErrors(q.given, q.rules)
  return errors.length === 0 ? 1 : `>1 — ${errors.join('; ')}`
}

/** The apparent positional shift a rotation causes, as a share of a cell. */
function rotationDrift() {
  const pts = [[0, -13], [10, 4], [3, 4], [3, 12], [-3, 12], [-3, 4], [-10, 4]]
  const rot = (p, deg) => {
    const r = (deg * Math.PI) / 180
    return [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)]
  }
  let worst = 0
  for (const deg of [0, 90, 180, 270]) {
    const q = pts.map((p) => rot(p, deg))
    const xs = q.map((p) => p[0])
    const ys = q.map((p) => p[1])
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    worst = Math.max(worst, Math.hypot(cx, cy) / 34)
  }
  return worst
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const parts = []
const drift = rotationDrift()

for (const q of questions) {
  const sym = q.given[0].symbols[0]
  const rule = q.rules[sym.id]
  const { errors, warnings } = verifyQuestion(q)
  const key1 = q.images[0].options.find((o) => o.id === q.images[0].correctOptionId)
  const key2 = q.images[1].options.find((o) => o.id === q.images[1].correctOptionId)
  const full = [...q.given, key1.panel, key2.panel]
  const facings = full.map((p) => FACING[p.symbols[0].rotation] ?? p.symbols[0].rotation)
  const cells = new Set(full.map((p) => `${p.symbols[0].cell.row},${p.symbols[0].cell.col}`))
  const shapes = new Set(full.map((p) => p.symbols[0].shape))
  const colours = new Set(full.map((p) => p.symbols[0].colour))

  parts.push(`<article><h2>${q.id} <span class="tag">${q.difficulty}</span> <span class="draft">DRAFT — NOT IN THE BANK</span></h2>`)

  parts.push(`<p class="rule"><strong>The rule.</strong> A ${sym.colour} ${sym.shape} holds cell R${sym.cell.row + 1}C${sym.cell.col + 1} and turns
    ${rule.rotation.degrees}&deg; ${rule.rotation.direction === 'cw' ? 'clockwise' : 'anticlockwise'} each panel.
    It does not move and does not change colour.</p>`)

  parts.push('<p class="lead">The complete sequence — the last two are the keyed continuations, shown faded.</p>')
  parts.push(
    '<div class="row">' +
      full
        .map((p, i) => `<figure>${matrixSvg(p, q.grid.rows, q.grid.cols, { ghost: i >= 4 })}<figcaption>${i + 1}${i >= 4 ? ' — key' : ''}<br><span class="facing">${facings[i]}</span></figcaption></figure>`)
        .join('') +
      '</div>',
  )

  for (const [ix, img] of q.images.entries()) {
    parts.push(`<p class="lead">Options for matrix ${ix + 5}</p>`)
    parts.push(
      '<div class="row">' +
        img.options
          .map((o) => {
            const correct = o.id === img.correctOptionId
            const s = o.panel.symbols[0]
            return `<figure>${matrixSvg(o.panel, q.grid.rows, q.grid.cols, { highlight: correct })}<figcaption>${o.id}${correct ? ' &check; key' : ''}<br><span class="facing">${FACING[s.rotation] ?? s.rotation} · R${s.cell.row + 1}C${s.cell.col + 1}</span></figcaption></figure>`
          })
          .join('') +
        '</div>',
    )
  }

  parts.push('<table class="checks"><tr><th>Check</th><th>Result</th></tr>' +
    [
      ['Distinct continuations the documented rule space allows', continuationCount(q)],
      ['Shape legible under rotation', shapes.size === 1 && ['arrow', 'triangle'].includes([...shapes][0]) ? `yes — ${[...shapes][0]}, consistent across all six panels` : `<b>NO — ${[...shapes].join(', ')}</b>`],
      ['Colour constant', colours.size === 1 ? `yes — ${[...colours][0]}` : `<b>NO — ${[...colours].join(', ')}</b>`],
      ['Cell constant (the mechanic under test)', cells.size === 1 ? `yes — R${sym.cell.row + 1}C${sym.cell.col + 1} throughout` : `<b>NO — ${[...cells].join(' ')}</b>`],
      ['All four facings shown', new Set(facings.slice(0, 4)).size === 4 ? 'yes — the direction cannot be read two ways' : `<b>only ${new Set(facings.slice(0, 4)).size}</b>`],
      ['verify-bank errors', errors.length === 0 ? 'none' : `<b>${errors.join('; ')}</b>`],
      ['verify-bank warnings', warnings.length === 0 ? 'none' : warnings.join('; ')],
      ['Provenance', `${q.meta.dmatAlignment} — ${q.meta.provenance?.mechanics}`],
    ]
      .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
      .join('') +
    '</table>')

  parts.push(`<p class="exp">${esc(q.explanation)}</p></article>`)
}

const html = `<!doctype html><meta charset="utf-8"><title>Static rotator — visual review</title><style>
body{font:15px/1.55 ui-sans-serif,system-ui;margin:0;padding:28px;background:#faf9f7;color:#2a2d31;max-width:1000px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:0 0 12px;display:flex;gap:8px;align-items:center}
article{background:#fff;border:1px solid #e5e1d9;border-radius:10px;padding:18px 20px;margin:0 0 20px}
.row{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0 16px}
figure{margin:0;text-align:center}figcaption{font-size:11px;color:#8a8681;margin-top:4px;line-height:1.35}
.facing{color:#a09b94}
.tag{font-size:11px;background:#f0ede7;border-radius:4px;padding:2px 7px;font-weight:500}
.draft{font-size:11px;color:#b4462f;border:1px solid #e9c4bb;background:#fdf3f1;border-radius:4px;padding:2px 7px}
.lead{margin:12px 0 4px;font-size:13px;color:#5c5852}
.rule{background:#fbfaf8;border-left:2px solid #d8d4cc;padding:8px 12px;margin:0 0 14px;font-size:14px}
.exp{font-size:13px;color:#5c5852;border-top:1px solid #eee;padding-top:10px;margin-top:14px}
table.checks{border-collapse:collapse;font-size:13px;width:100%;margin:6px 0 0}
.checks th,.checks td{border:1px solid #e5e1d9;padding:5px 10px;text-align:left}
.checks th{background:#faf9f7;font-weight:510}.checks td:first-child{width:46%;color:#5c5852}
.banner{background:#fdf3f1;border:1px solid #e9c4bb;border-radius:8px;padding:14px 16px;margin:0 0 20px;font-size:13px;line-height:1.6}
.evidence{background:#f7f9f8;border:1px solid #d9e5df;border-radius:8px;padding:14px 16px;margin:0 0 20px;font-size:13px;line-height:1.6}
</style>
<h1>Static rotator pilot — visual review</h1>
<div class="banner"><strong>SIX DRAFT ITEMS. NOT IN THE BANK. NOT APPROVED.</strong>
They test <code>staticRotatingSymbol</code> — a symbol that holds its cell and turns — which Exercises 3 and 6
attest by carrying a rotation clause with no movement clause. It is filed under <code>FS_CONTRACT.review</code>,
so every item built on it is <code>reasonable_extrapolation</code> and says so.
This file is not part of the application, is not a route, and does not reach the production build.
Answer keys are shown because this is a reviewer's view.</div>
<div class="evidence"><strong>Existing evidence, which is not approval.</strong>
An independent blind round on Claude Sonnet 5 — a different model from the author's — was given the four shown
matrices and the three options per image as structured data, with keys, rules and explanations withheld and
verified absent before dispatch. It chose <strong>12 of 12</strong> continuations in agreement with the keys and
judged <code>exactlyOneDefensibleContinuation</code> true on all six. It reported checking and ruling out a second
direction reading, an accelerating reading, a moved-and-returned reading and a reflection reading, and rated all
six <em>easy</em>.
<br><br>Two models agreeing is evidence about these items. It is not a person taking responsibility for putting
them in front of a candidate, and this sheet exists so that a person can.
<br><br><strong>Measured, not eyeballed:</strong> both the production renderer and this one rotate about the cell
centre. The arrow polygon is slightly asymmetric about its origin, so its bounding box does shift under rotation —
by <strong>${(drift * 100).toFixed(1)}% of a cell</strong> at every orientation, about ${(drift * 34).toFixed(1)}px on a 34px cell. That is
the only positional artefact, and it is nowhere near a one-cell move.</div>
${parts.join('\n')}`

writeFileSync(new URL('review.html', DIR), html)
console.log(`wrote drafts/static-rotator-2026-11-14/review.html — ${questions.length} items`)
console.log(`rotation drift: ${(drift * 100).toFixed(2)}% of a cell`)
