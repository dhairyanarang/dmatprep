#!/usr/bin/env node
/**
 * Audit tool for the official dMAT source PDFs.
 *
 * The g.a.s.t. preparatory materials embed subset fonts with custom encodings, so
 * naive text extraction returns mojibake and `pdftotext` is not available on this
 * machine. This resolves text properly by parsing each font's /ToUnicode CMap, and
 * can also export the embedded diagrams (which is how the 4x4 Figure Sequences grid
 * was confirmed).
 *
 * Usage:
 *   node scripts/extract-pdf.mjs <file.pdf>                    # all text
 *   node scripts/extract-pdf.mjs <file.pdf> --pages 7-16       # a page range
 *   node scripts/extract-pdf.mjs <file.pdf> --images ./out 9 10 # export page images
 *
 * Do not commit the source PDFs or their exported images: they carry an explicit
 * g.a.s.t. copyright notice and this repository is public.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import zlib from 'node:zlib'

// ---------------------------------------------------------------- PDF parsing

function parseObjects(buf) {
  const latin = buf.toString('latin1')
  const objs = new Map()
  const re = /(\d+)\s+\d+\s+obj\b([\s\S]*?)endobj/g
  let m
  while ((m = re.exec(latin)) !== null) {
    const body = m[2]
    const sIdx = body.search(/stream\r?\n/)
    let dict = body
    let stream = null
    if (sIdx !== -1) {
      dict = body.slice(0, sIdx)
      const bodyStart = m.index + m[0].length - 'endobj'.length - body.length
      const dataStart = latin.indexOf('\n', bodyStart + sIdx) + 1
      stream = buf.subarray(dataStart, latin.indexOf('endstream', dataStart))
    }
    objs.set(Number(m[1]), { dict, stream })
  }
  return objs
}

const inflate = (b) => {
  try {
    return zlib.inflateSync(b, { finishFlush: zlib.constants.Z_SYNC_FLUSH })
  } catch {
    return null
  }
}

const streamData = (objs, n) => {
  const o = objs.get(n)
  if (!o?.stream) return null
  return /FlateDecode/.test(o.dict) ? inflate(o.stream) : o.stream
}

const refOf = (dict, key) => {
  const r = new RegExp(`${key}\\s+(\\d+)\\s+\\d+\\s+R`).exec(dict)
  return r ? Number(r[1]) : null
}
const numOf = (dict, key) => {
  const r = new RegExp(`${key}\\s+(\\d+)`).exec(dict)
  return r ? Number(r[1]) : null
}

/** Build code -> unicode from a /ToUnicode CMap stream. */
function parseCMap(buf) {
  const s = buf.toString('latin1')
  const map = new Map()
  // bfchar destinations are UTF-16BE, one or more code units per entry.
  const utf16be = (hex) => {
    let s = ''
    for (let i = 0; i + 3 < hex.length; i += 4) s += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16))
    return s
  }
  for (const [, blk] of s.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const [, src, dst] of blk.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      map.set(parseInt(src, 16), utf16be(dst))
    }
  }
  for (const [, blk] of s.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    const re = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g
    for (const [, lo, hi, dst] of blk.matchAll(re)) {
      const a = parseInt(lo, 16)
      const b = parseInt(hi, 16)
      const base = parseInt(dst, 16)
      for (let i = a; i <= b; i++) map.set(i, String.fromCharCode(base + i - a))
    }
  }
  return map
}

function fontCMaps(objs) {
  const out = new Map()
  for (const [num, { dict }] of objs) {
    const tu = refOf(dict, '/ToUnicode')
    if (tu === null) continue
    const data = streamData(objs, tu)
    if (data) out.set(num, parseCMap(data))
  }
  return out
}

const pageObjects = (objs) =>
  [...objs.keys()].filter((n) => /\/Type\s*\/Page[^s]/.test(objs.get(n).dict))

function resourcesOf(objs, pageDict) {
  const r = refOf(pageDict, '/Resources')
  if (r !== null) return objs.get(r).dict
  return /\/Resources\s*<<([\s\S]*)/.exec(pageDict)?.[1] ?? ''
}

/** Decode a PDF literal string body, resolving backslash escapes. */
function unescape(raw) {
  const out = []
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== 0x5c) {
      out.push(raw[i])
      continue
    }
    const next = raw[++i]
    const simple = { 0x6e: 10, 0x72: 13, 0x74: 9, 0x62: 8, 0x66: 12 }[next]
    if (simple !== undefined) {
      out.push(simple)
    } else if (next >= 0x30 && next <= 0x37) {
      let oct = ''
      while (raw[i] >= 0x30 && raw[i] <= 0x37 && oct.length < 3) oct += String.fromCharCode(raw[i++])
      i--
      out.push(parseInt(oct, 8) & 0xff)
    } else {
      out.push(next)
    }
  }
  return Buffer.from(out)
}

function pageText(objs, cmaps, pageNum) {
  const { dict } = objs.get(pageNum)
  const res = resourcesOf(objs, dict)

  let fontDict = /\/Font\s*<<([\s\S]*?)>>/.exec(res)?.[1] ?? ''
  if (!fontDict) {
    const fr = refOf(res, '/Font')
    if (fr !== null) fontDict = objs.get(fr).dict
  }
  const names = new Map(
    [...fontDict.matchAll(/\/(\w+)\s+(\d+)\s+\d+\s+R/g)].map(([, n, o]) => [n, Number(o)]),
  )

  let content = Buffer.alloc(0)
  const cr = refOf(dict, '/Contents')
  if (cr !== null) {
    content = streamData(objs, cr) ?? Buffer.alloc(0)
  } else {
    const arr = /\/Contents\s*\[([\s\S]*?)\]/.exec(dict)?.[1] ?? ''
    for (const [, r] of arr.matchAll(/(\d+)\s+\d+\s+R/g)) {
      content = Buffer.concat([content, streamData(objs, Number(r)) ?? Buffer.alloc(0)])
    }
  }

  const src = content.toString('latin1')
  const tokens = /\/(\w+)\s+[\d.]+\s+Tf|\((?:\\.|[^\\()])*\)|T\*|ET/g
  let current = null
  let out = ''
  let m
  while ((m = tokens.exec(src)) !== null) {
    const tok = m[0]
    if (tok.endsWith('Tf')) {
      current = cmaps.get(names.get(m[1]) ?? -1) ?? null
      continue
    }
    if (tok === 'T*' || tok === 'ET') {
      out += '\n'
      continue
    }
    const bytes = unescape(Buffer.from(tok.slice(1, -1), 'latin1'))
    out += current
      ? [...bytes].map((b) => current.get(b) ?? '').join('')
      : bytes.toString('latin1')
  }
  return out.replace(/\n{3,}/g, '\n\n').trim()
}

// ------------------------------------------------------------- PNG export

const CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(b) {
  let c = -1
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const payload = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(payload))
  return Buffer.concat([len, payload, crc])
}

function writePng(file, width, height, channels, raw) {
  const stride = width * channels
  const scan = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw.copy(scan, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = channels === 3 ? 2 : 0
  writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      pngChunk('IHDR', ihdr),
      pngChunk('IDAT', zlib.deflateSync(scan)),
      pngChunk('IEND', Buffer.alloc(0)),
    ]),
  )
}

function exportImages(objs, pageNums, outDir, wanted) {
  mkdirSync(outDir, { recursive: true })
  for (const idx of wanted) {
    const pn = pageNums[idx - 1]
    if (pn === undefined) continue
    const res = resourcesOf(objs, objs.get(pn).dict)
    const xr = refOf(res, '/XObject')
    const xDict = xr !== null ? objs.get(xr).dict : (/\/XObject\s*<<([\s\S]*?)>>/.exec(res)?.[1] ?? '')

    for (const [, name, num] of xDict.matchAll(/\/(\w+)\s+(\d+)\s+\d+\s+R/g)) {
      const o = objs.get(Number(num))
      if (!o || !/\/Subtype\s*\/Image/.test(o.dict)) continue
      const w = numOf(o.dict, '/Width')
      const h = numOf(o.dict, '/Height')
      const base = `${outDir}/p${idx}_${name}`

      if (/DCTDecode/.test(o.dict)) {
        writeFileSync(`${base}.jpg`, o.stream)
        console.log(`  ${name} ${w}x${h} -> ${base}.jpg`)
        continue
      }
      if (numOf(o.dict, '/BitsPerComponent') !== 8) continue

      const raw = inflate(o.stream)
      const channels = /DeviceGray/.test(o.dict) ? 1 : 3
      if (!raw || raw.length < w * h * channels) continue

      // Composite the soft mask onto white; without it transparent regions decode
      // as black and swallow the grid lines entirely.
      let pixels = raw
      const smNum = refOf(o.dict, '/SMask')
      if (smNum !== null && objs.has(smNum)) {
        const sm = objs.get(smNum)
        const alpha = inflate(sm.stream)
        if (
          alpha &&
          numOf(sm.dict, '/Width') === w &&
          numOf(sm.dict, '/Height') === h &&
          alpha.length >= w * h
        ) {
          pixels = Buffer.alloc(w * h * channels)
          for (let i = 0; i < w * h; i++) {
            const a = alpha[i] / 255
            for (let c = 0; c < channels; c++) {
              pixels[i * channels + c] = Math.round(raw[i * channels + c] * a + 255 * (1 - a))
            }
          }
        }
      }
      writePng(`${base}.png`, w, h, channels, pixels)
      console.log(`  ${name} ${w}x${h} -> ${base}.png`)
    }
  }
}

// ------------------------------------------------------------------ CLI

const argv = process.argv.slice(2)
const file = argv[0]
if (!file) {
  console.error('usage: node scripts/extract-pdf.mjs <file.pdf> [--pages A-B] [--images <dir> N...]')
  process.exit(1)
}

const buf = readFileSync(file)
const objs = parseObjects(buf)
const pages = pageObjects(objs)

const imagesAt = argv.indexOf('--images')
if (imagesAt !== -1) {
  const outDir = argv[imagesAt + 1]
  const wanted = argv.slice(imagesAt + 2).map(Number).filter(Number.isFinite)
  console.log(`${pages.length} pages; exporting images for ${wanted.join(', ') || 'none'}`)
  exportImages(objs, pages, outDir, wanted)
} else {
  const cmaps = fontCMaps(objs)
  const rangeAt = argv.indexOf('--pages')
  let [from, to] = [1, pages.length]
  if (rangeAt !== -1) {
    const [a, b] = argv[rangeAt + 1].split('-').map(Number)
    from = a
    to = b ?? a
  }
  for (let i = from; i <= Math.min(to, pages.length); i++) {
    console.log(`\n===== PAGE ${i} =====`)
    console.log(pageText(objs, cmaps, pages[i - 1]))
  }
}
