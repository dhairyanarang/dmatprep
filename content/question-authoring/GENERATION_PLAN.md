# Generation plans

Spec §6 requires a written plan before every batch. Its purpose is narrow: to
stop successive batches from re-producing the same easy pattern, and to make the
intent of a batch reviewable *before* 100 questions exist.

`scripts/generate-batch.mjs` requires `--plan` for any batch over 20 items and
records the plan's identity on every question it produces.

## Where plans live

`content/question-authoring/plans/<batchId>.json`, one per batch, committed.

## Required fields

Validated by `scripts/lib/plan.mjs`.

| Field | Meaning |
|---|---|
| `batchId` | `b2`, `b3`, … — must match `--batch` |
| `name` | short human label, e.g. "Pilot: 15 per section" |
| `section` | `figure-sequences` \| `mathematical-equations` \| `latin-squares` |
| `generatorVersion` | the version this plan was written against |
| `counts` | `{ low, medium, high }` |
| `currentCoverage` | pattern counts in the existing bank — **derive with `node scripts/audit-bank.mjs`, never from memory** |
| `overrepresented` | patterns to avoid |
| `gaps` | patterns this batch exists to fill |
| `mechanics.allowed` / `.review` / `.forbidden` | the contract this batch runs under, from `scripts/lib/contract.mjs` |
| `difficultyModel` | how each tier is measured, and the gate values |
| `distractorConstraints` | per-family caps |
| `structuralConstraints` | fingerprint dimensions and reuse caps |
| `seedStrategy` | how per-item seeds are derived |
| `expectedDistribution` | pattern → count *after* the batch, to compare against the result |

## Template

```json
{
  "batchId": "b2",
  "name": "Pilot — 15 per section",
  "section": "figure-sequences",
  "generatorVersion": "3.0.0",
  "counts": { "low": 5, "medium": 5, "high": 5 },
  "currentCoverage": {
    "note": "from node scripts/audit-bank.mjs on <date>",
    "patterns": {}
  },
  "overrepresented": [],
  "gaps": [],
  "mechanics": {
    "allowed": ["see FS_CONTRACT.allowed in scripts/lib/contract.mjs"],
    "review": [],
    "forbidden": ["see FS_CONTRACT.forbidden"]
  },
  "difficultyModel": {
    "metric": "peak transformation load, measured after simulation",
    "low": "1 symbol, peakLoad <= 2",
    "medium": "2-3 symbols, peakLoad == 3",
    "high": "3-4 symbols, peakLoad >= 4"
  },
  "distractorConstraints": {
    "minFamiliesPerItem": 2,
    "forbidden": ["two-field linear or diagonal movement"]
  },
  "structuralConstraints": {
    "fingerprint": "tier | movement family + step class + rotation + colour-cycle length + symmetry-canonical track",
    "maxPerFingerprint": 2,
    "maxPerFamily": 6
  },
  "seedStrategy": "seed = SHA-256(generator, section, tier, batchId, index, attempt), per item",
  "expectedDistribution": {}
}
```

## Reviewing a batch against its plan

After generation, compare `expectedDistribution` with what actually landed. A
batch that missed its distribution is not automatically wrong, but the gap is the
thing to look at first — it usually means a constraint is tighter than expected,
or a structure is not reachable at all.
