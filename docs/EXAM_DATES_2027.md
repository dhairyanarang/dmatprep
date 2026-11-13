# Official information re-read, 14 November 2026

Every quotation below was fetched live on 14 November 2026. Nothing here is
from memory, and nothing is from a third-party guide.

## 1. The product was counting down to dates that had passed

`content/exam/key-dates.ts` held two literals — registration closing
2026-09-15, exam day 2026-09-26. Both had been in the past for seven weeks. The
home page and the sidebar counted down to them, and the study plan offered
"seven weeks to Saturday 26 September 2026" from November.

Nothing failed, because nothing was checking a date against the clock.

## 2. The 2027 cycles, verbatim

From `d-mat.de/en/dmat-in-india/`:

> "28 October 2026" – Start registration
> "04 January 2027" – Application deadline
> "16 January 2027" – dMAT test date
> "08 February 2027" – Release of results
>
> "01 March 2027" – Application deadline
> "13 March 2027" – dMAT test date
> "05 April 2027" – Release of results

Now in `EXAM_CYCLES`.

## 3. The transitional rule is conjunctive — resolved

This was held unpublished because an earlier fetch returned the APS wording as
a summary rather than a quotation, and the connective looked disjunctive. Read
verbatim, both sources agree:

> "Applicants who completed their APS online registration on or after 29 June
> 2026 **and** shipped their APS application documents on or after 29 June 2026
> are required to submit a dMAT certificate"
> — `aps-india.de/dmat/`

> "Applicants who registered online with APS on or after 29 June 2026 **and**
> sent their application documents on or after 29 June 2026, require a dMAT
> certificate"
> — `d-mat.de/en/faq-graduate-students-india/`

**Both conditions must hold.** Meeting only one does not trigger the
requirement. The earlier disjunctive reading was a summarisation artefact —
which is precisely why it was not published on a guess.

Recorded in `content/exam/claims.ts` under Dates & Logistics.

## 4. Two discrepancies that remain open

Neither is resolved here, and neither should be resolved by choosing a side.

### 4.1 The FAQ still shows the 2026 cycle

Read 14 November 2026, `d-mat.de/en/faq-graduate-students-india/` still says:

> "Registration opens: 29 June 2026"
> "Registration deadline: 15 September 2026"
> "Test date: 26 September 2026"
> "Results published and certificates issued: 12 October 2026"

The India page on the same site carries the 2027 cycles. Neither page
acknowledges the other. We present the India page as current and record the FAQ
alongside it, because a candidate who lands on the FAQ first will see dates that
have passed and needs to know why the two differ.

### 4.2 The affected-fields lists differ

| `d-mat.de/en/dmat-in-india/` — three groups | `aps-india.de/dmat/` — five categories |
|---|---|
| Engineering | Engineering/Technology (all B.Tech, B.Eng, and other engineering degrees) |
| Commerce, Accounting, Finance, Economics | Commerce & Economics |
| Business / Management | Business & Management |
| | Tourism, Travel & Hospitality |
| | Integrated & Dual-Degree Programs (if any component falls within above) |

Both read 14 November 2026. The FAQ states that eligibility is determined by
APS India, not g.a.s.t., so APS's broader list is the safer one to show — but
both are shown, and candidates are directed to APS.

## 5. Still unresolved, unchanged

- **Total duration.** The PDF says "about three hours with a break of 30
  minutes"; `d-mat.de` says "three and a half hours". Computed from the parts:
  75 + 30 + 90 = 195 minutes. Show the breakdown and cite both.
- **GAM length.** The FAQ gives "approximately 60 individual questions. This is
  an average; the actual number may be higher or lower." Our GAM has 19 active
  questions. No claim of a full-length simulation is supportable.
- **GAM duration** is stated only in the PDF (p. 34), not on any web page.

## 6. What now prevents a silent recurrence

`content/exam/key-dates.ts` models cycles rather than loose dates, and
`nextCycle` picks the next sitting from the live clock in the browser — not at
build time, which on a fully prerendered site would freeze the choice at the
build date.

`scripts/test/exam-dates.test.mjs` fails when every announced sitting has
passed, when the study plan ends on a date that is not a real sitting, and when
user-facing copy presents a 2026 date as upcoming. The first of those is
designed to start failing in March 2027. That is not a time bomb to defuse; it
is the prompt to re-read `d-mat.de/en/dmat-in-india/`, which is the only place
the next answer exists.
