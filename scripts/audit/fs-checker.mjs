/**
 * An independent continuation check for Figure Sequences.
 *
 * It reads ONLY the four shown matrices and the three options per image. It
 * never reads the question's stored `rules`, and never reads
 * `correctOptionId` except at the very end, to compare its own conclusion
 * against the key.
 *
 * The method is inversion rather than replay. Applying the stored rule and
 * checking it reproduces the marked panel is circular — it proves the rule and
 * the key agree, not that a candidate could have got there. What matters is
 * whether the four shown matrices admit exactly one continuation. Border
 * travel and linear movement are identical while a symbol runs an edge without
 * turning a corner, and that is how two genuinely ambiguous items shipped
 * before anyone inverted anything.
 */
import { invertSymbol } from '../lib/fs-inversion.mjs'

/**
 * What the four givens imply for panels five and six.
 *
 * Returns `ambiguous` with the aspect at fault when more than one
 * continuation survives, which is a defect in the question rather than in the
 * key.
 */
export function deriveContinuation(question) {
  const panels = question.given
  if (!Array.isArray(panels) || panels.length !== 4) {
    return { error: `expected 4 given matrices, found ${panels?.length}` }
  }

  const ids = panels[0].symbols.map((s) => s.id)
  const fifth = []
  const sixth = []
  const ambiguities = []

  for (const id of ids) {
    const observed = panels.map((panel) => {
      const symbol = panel.symbols.find((s) => s.id === id)
      return symbol ? { ...symbol } : null
    })
    if (observed.some((o) => o === null)) {
      return { error: `symbol ${id} is missing from at least one given matrix` }
    }

    const inverted = invertSymbol(observed)
    if (inverted.movements.size === 0 || inverted.rotations.size === 0 || inverted.colours.size === 0) {
      return { error: `no rule explains symbol ${id} across the four matrices` }
    }

    if (inverted.movements.size > 1) ambiguities.push(`${id}: ${inverted.movements.size} movements`)
    if (inverted.rotations.size > 1) ambiguities.push(`${id}: ${inverted.rotations.size} rotations`)
    if (inverted.colours.size > 1) ambiguities.push(`${id}: ${inverted.colours.size} colour rules`)

    const movement = [...inverted.movements.values()][0]
    const rotation = [...inverted.rotations.values()][0]
    const colour = [...inverted.colours.values()][0]
    const shape = observed[0].shape

    fifth.push({ id, shape, cell: movement.fifth, rotation: rotation.fifth, colour: colour.fifth })
    sixth.push({ id, shape, cell: movement.sixth, rotation: rotation.sixth, colour: colour.sixth })
  }

  if (ambiguities.length) return { ambiguous: ambiguities }
  return { fifth, sixth }
}

/** A comparable fingerprint of a panel, independent of symbol order. */
function fingerprint(symbols) {
  return symbols
    .map((s) => `${s.id}@${s.cell.row},${s.cell.col}:${s.rotation}:${s.colour}`)
    .sort()
    .join('|')
}

/**
 * Which option each image's derived panel matches.
 *
 * `matches` is every option consistent with the derivation — more than one
 * means two options are the same panel, which is a defect of its own.
 */
export function checkImages(question, derived) {
  const out = []
  const wanted = { image1: derived.fifth, image2: derived.sixth }

  for (const image of question.images) {
    const target = wanted[image.label]
    if (!target) {
      out.push({ label: image.label, error: `unexpected image label "${image.label}"` })
      continue
    }
    const want = fingerprint(target)
    const matches = image.options
      .filter((option) => fingerprint(option.panel.symbols) === want)
      .map((option) => option.id)

    const duplicates = new Set()
    const seen = new Map()
    for (const option of image.options) {
      const print = fingerprint(option.panel.symbols)
      if (seen.has(print)) duplicates.add(`${seen.get(print)} = ${option.id}`)
      seen.set(print, option.id)
    }

    out.push({ label: image.label, matches, stored: image.correctOptionId, duplicates: [...duplicates] })
  }
  return out
}
