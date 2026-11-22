# Archive — historical records, not instructions

**Nothing in this folder describes how the product works today, and nothing in
it should be followed.** These are point-in-time reports: what was true, what
was decided and what was found on a particular date. They are kept because the
*reasoning* behind a decision is often the only thing that explains a line of
code six months later — not because any of them is current.

If you want the current state, read `CLAUDE.md` and `docs/README.md`.

Two specific traps, since these documents are confidently written:

- Each sprint report describes a branch that has since merged, and states
  things like "nothing pushed, nothing merged to `main`". That was true the day
  it was written and is false now.
- `EXAM_DATES_2027.md` holds dMAT dates. **Do not take a date from here.** The
  live dates are `content/exam/key-dates.ts`, pinned by
  `scripts/test/exam-dates.test.mjs`, and summarised in `CLAUDE.md`. Rule zero
  applies: a date in an archived file is a memory, not a source.

---

| Document | What it records | Dated |
|---|---|---|
| **`SPRINT2_REPORT.md`** | Release-readiness work on `sprint2/release-readiness`. | 14 Nov 2026 |
| **`SPRINT3_REPORT.md`** | Release-candidate work on `sprint3/release-candidate`. | 18 Nov 2026 |
| **`SPRINT4_REPORT.md`** | Legal, infrastructure and payments. Still worth reading: §3.4a describes an entitlement defect that could have taken money and granted nothing, and §6.1 risk 1 is cited from `lib/payments/entitlement.ts`. | 18 Nov 2026, revised after review |
| **`CORE_MODULE_REVIEW.md`** | Operator feedback on the Core modules and where each item stood. The work it describes was carried out in the exam-alignment pass. | 18 Nov 2026 |
| **`EXAM_DATES_2027.md`** | The live re-read of official sources that found the product counting down to dates that had passed. Its findings are now in `content/exam/key-dates.ts` and `CLAUDE.md`. Superseded, and kept for the quotations and the method. | 14 Nov 2026 |
| **`FINAL_APPLICATION_AUDIT.md`** | Application-wide audit of the `feat/complete-ui-ux-revamp` branch. | 21 Nov 2026 |
| **`QUESTION_BANK_CORRECTNESS_AUDIT.md`** | Correctness audit over every active Core question at that date. The bank has since grown by 80 questions; `npm run verify:bank` is the current answer. | 21 Nov 2026 |
