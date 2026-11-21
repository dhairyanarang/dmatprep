# Pilot batch P1 — DRAFT, UNAPPROVED, NOT FOR PUBLICATION

Nothing in this directory is part of the product. No file here is imported by the
application, reaches the build output, or is served to anyone. These are
candidates for human review and nothing more.

| File | Contents |
| --- | --- |
| `_selected.json` | The two Figure Sequences and two Latin Squares candidates |
| `_raw-fs.json`, `_raw-ls.json` | The full generated pools they were selected from, kept so the selection can be audited |
| `me-pilot.json` | Three Mathematical Equations candidates — **BLOCKED**, see below |
| `gam-pilot.json` | One Business Administration source pack with one question |

## The Mathematical Equations candidates are blocked

The three items in `me-pilot.json` use a letter multiplied or divided by another
letter. `ME_CONTRACT` in `scripts/lib/contract.mjs` forbids that outright —
`"quadratic or higher-power terms"` is on its `forbidden` list, and its
`equationShapes` enumerate every system shape verified against the official
exercises, all of which are linear.

They are kept here as authored, verified drafts so the decision can be taken on
the evidence rather than re-derived. They are each independently proved to have
exactly one solution over 1–20, but they **fail the project's own contract gate**
and must not be committed to the bank unless that contract is deliberately
changed — a decision that needs a basis in public official material, not in
anyone's recollection of a sitting.

## Status

Every item is `releaseStatus: draft`. No item has human sign-off. Automated
validation and blind adjudication alone do not establish quality, uniqueness or
originality.
