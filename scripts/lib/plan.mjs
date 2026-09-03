/**
 * Generation-plan validation.
 *
 * Spec §6 has always required a written plan before a batch; none of the three
 * batches that produced the current bank left one, which is why nobody could say
 * afterwards why the low tier was 15 identical shapes. This validates the shape
 * so a plan cannot be written that omits the parts that stop repetition.
 *
 * See content/question-authoring/GENERATION_PLAN.md for the template.
 */
import { SECTIONS } from './bank.mjs'
import { BATCH_ID_PATTERN } from './seed.mjs'

const REQUIRED = [
  'batchId',
  'name',
  'section',
  'generatorVersion',
  'counts',
  'currentCoverage',
  'overrepresented',
  'gaps',
  'mechanics',
  'difficultyModel',
  'distractorConstraints',
  'structuralConstraints',
  'seedStrategy',
  'expectedDistribution',
]

export function validatePlan(plan) {
  const errors = []

  for (const field of REQUIRED) {
    if (plan?.[field] === undefined) errors.push(`missing required field "${field}"`)
  }
  if (errors.length) return errors

  if (!BATCH_ID_PATTERN.test(plan.batchId)) errors.push(`batchId "${plan.batchId}" must look like b2`)
  if (plan.batchId === 'b1') errors.push('b1 is the original bank and cannot be planned for')
  if (!SECTIONS.includes(plan.section)) errors.push(`unknown section "${plan.section}"`)

  for (const tier of ['low', 'medium', 'high']) {
    const n = plan.counts?.[tier]
    if (n === undefined) errors.push(`counts.${tier} is missing`)
    else if (!Number.isInteger(n) || n < 0) errors.push(`counts.${tier} must be a non-negative integer`)
  }

  for (const key of ['allowed', 'review', 'forbidden']) {
    if (!Array.isArray(plan.mechanics?.[key])) errors.push(`mechanics.${key} must be an array`)
  }
  if (!Array.isArray(plan.overrepresented)) errors.push('overrepresented must be an array')
  if (!Array.isArray(plan.gaps)) errors.push('gaps must be an array')

  // Optional: per-slot coverage targets. They steer which documented structure a
  // slot attempts; they never relax a gate, so they are validated for shape only.
  if (plan.slotTargets !== undefined) {
    if (typeof plan.slotTargets !== 'object' || plan.slotTargets === null || Array.isArray(plan.slotTargets)) {
      errors.push('slotTargets must be an object keyed by tier')
    } else {
      for (const [tier, list] of Object.entries(plan.slotTargets)) {
        if (!['low', 'medium', 'high'].includes(tier)) errors.push(`slotTargets has unknown tier "${tier}"`)
        if (!Array.isArray(list)) {
          errors.push(`slotTargets.${tier} must be an array indexed by slot`)
          continue
        }
        if (list.length > (plan.counts?.[tier] ?? 0)) {
          errors.push(`slotTargets.${tier} has more entries than counts.${tier}`)
        }
      }
    }
  }

  const caps = plan.structuralConstraints ?? {}
  if (!Number.isInteger(caps.maxPerFingerprint) || caps.maxPerFingerprint < 1) {
    errors.push('structuralConstraints.maxPerFingerprint must be a positive integer')
  }

  // The whole point of the plan is to be written against measured coverage.
  if (plan.currentCoverage && typeof plan.currentCoverage === 'object' && !plan.currentCoverage.note) {
    errors.push('currentCoverage.note must record when and how coverage was measured')
  }

  return errors
}
