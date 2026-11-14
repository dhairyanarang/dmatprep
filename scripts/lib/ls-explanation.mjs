/**
 * Build a Latin Squares explanation from the solver's own record.
 *
 * The old form listed every intermediate placement as a bare assertion —
 * "R5C2 must be D" — which is fine for a naked single, where the reason is a
 * glance at the row and column, and wrong for a pair-elimination step, where it
 * throws away the only interesting part of the deduction. 73 of the 125
 * committed questions use a pair somewhere in the chain, and not one of them
 * explained it.
 *
 * Every word here comes from `solutionSteps`, which the solver produced and
 * `verify-bank` re-derives. Nothing is invented at explanation time.
 *
 * On the wording: CLAUDE.md is explicit that pair elimination is a faster
 * search and not a stronger technique — on a two-missing line it is the logical
 * dual of a naked single at the partner cell, so no item can require it. The
 * closing clause says exactly that, and the text never claims a step needs a
 * pair.
 */
export function buildLatinExplanation(steps, cellName) {
  if (steps.length === 1) {
    return `${steps[0].reason} Four of the five letters are already visible from the target's own row and column, so no other cell needs filling first.`
  }

  const intermediate = steps.slice(0, -1)
  const final = steps[steps.length - 1]

  // Walk in order, collapsing runs of naked singles into one compact sentence
  // and giving each pair step its own reason in place. Order is the chain, so
  // it cannot be regrouped by technique without misrepresenting the deduction.
  const parts = []
  let run = []
  const flush = () => {
    if (!run.length) return
    parts.push(`Fill the forced cells first: ${run.map((s) => `${cellName(s.cell)} must be ${s.letter}`).join('; ')}.`)
    run = []
  }
  for (const step of intermediate) {
    if (step.technique === 'pair-elimination') {
      flush()
      parts.push(step.reason)
    } else {
      run.push(step)
    }
  }
  flush()
  parts.push(final.reason)

  if (intermediate.some((s) => s.technique === 'pair-elimination')) {
    parts.push(
      'The pair is a shortcut rather than a requirement: on a line missing only two letters it is the same deduction as a naked single at the partner cell, so the chain closes either way.',
    )
  }

  // The first run, if there was one, already opens with "Fill the forced cells
  // first"; a later run would repeat the phrase, so soften any repeat.
  return parts
    .map((p, i) => (i > 0 ? p.replace(/^Fill the forced cells first: /, 'That frees more cells: ') : p))
    .join(' ')
}
