# Final application audit

**Audited** 21 November 2026 · **Branch** `feat/complete-ui-ux-revamp` ·
**Environment** localhost only. Nothing was pushed, merged or deployed, and no
production system was touched.

Status words are used strictly:

- **Passed** — exercised and observed working.
- **Partially verified** — exercised in part; the untested part is named.
- **Not tested** — not exercised. Said plainly rather than assumed.
- **Failed** — exercised and broken.

---

## 1. Summary by area

| Area | Status | Note |
|---|---|---|
| Routes and HTTP status | Passed | 42 routes swept; all resolve as intended |
| Navigation and breadcrumbs | Passed | Sidebar, breadcrumbs and two internal sidebars |
| Search | Passed | Exercised in the browser; 5 automated gates added |
| Dashboard zero state and first session | Passed | Both observed with real data |
| Core practice (FS, ME, LS) | Passed | Answering, feedback, navigator, filters |
| Timed tests and mocks | Passed | Briefing, clock, flags, submit, scoring, results |
| Four fixed mocks | Passed | Hash lock unchanged |
| Account and erase-progress | Partially verified | Erase confirm shown; destructive path not run |
| Pro presentation and dialog | Passed | Sidebar, Prepare, Test, dialog, dismissal |
| Checkout up to the payment button | Passed | On real Razorpay **test** keys |
| Razorpay payment itself | **Not tested** | Needs a signed-in account. See §7 |
| Pro activation and persistence | **Not tested** | Follows the payment |
| Desktop layout | Passed | 1440×1000 |
| Mobile layout | Passed | 390×844; one defect found and fixed |
| Console and runtime errors | Partially verified | Sampled, not exhaustive. See §9 |
| Build, lint, typecheck, tests | Passed | 488 tests, 0 failures |

---

## 2. Routes swept

Every route was requested and its status and final URL recorded.

**200, as intended (36):** `/`, `/prepare`, `/test`, `/exam`, `/exam/format`,
`/exam/rules`, `/exam/scoring`, `/exam/logistics`, `/exam/checklist`,
`/exam/sources`, `/information`, `/contact`, `/privacy`, `/terms`, `/account`,
`/pricing`, `/practice/quick`, `/practice/mistakes`, `/practice/diagnostic`,
`/practice/simulation`, `/practice/timed/{figure-sequences,
mathematical-equations, latin-squares}`, `/module-a/figure-sequences`,
`/module-a/{section}/overview`, `/module-a/{section}/practice` (×3 each),
`/module-b`, `/module-b/timed`, `/test/mock/core-mock-{1,2,3,4}`.

**307 redirects, as intended (4):** `/study-plan → /prepare`,
`/about → /information`, `/refunds → /terms`, `/review → /`.

**404, as intended (2):** `/not-a-real-page`; and `/checkout`, which does not
exist while commerce is off — a checkout that cannot charge is a dead end, so
it is not served rather than served empty.

Automated gates covering this permanently:

- `scripts/test/navigation.test.mjs` — every internal link resolves; every
  route is reachable; negative control proves the resolver rejects a fake path.
- `scripts/test/search.test.mjs` — **new in this pass**; see §4.

---

## 3. Navigation and interactive controls

**Passed.** Checked in the browser:

- Sidebar: five rows in two groups, correct active state, Home icon now the
  same glyph as the breadcrumb's.
- Breadcrumbs on every page checked, including `Home / Information / Terms` and
  `Home / About the Exam / Exam-day rules`.
- Internal sidebars on About the Exam and Information: active highlighting,
  direct URLs, and section-to-section movement.
- Account row menu: opens upward, Escape and click-away close it.
- Pro dialog: opens from Prepare lock rows and the Test panel, closes by ×, by
  scrim, by Escape and by "Keep practising free".
- Search palette: ⌘K, typing, clicking a result, Escape.
- Practice bar: question dots jump correctly; All/To do/Missed and difficulty
  chips filter without renumbering questions.
- Exam runner: task navigator, Flag, Previous/Next, Submit and its confirmation
  dialog's both paths.

**No dead control was found.** One was fixed earlier in the revamp (the Pro
dialog did nothing while commerce was off; its action now points at `/pricing`
in that state).

---

## 4. Search

**Passed.** Exercised in the browser, not merely inspected.

- Partial term `lat` → Latin Squares overview, practice, timed set, plus guide
  headings, grouped by destination.
- `mock` → 8 results including all four fixed mocks.
- `privacy` → Your data.
- `refund` → Terms. The refunds page was removed this pass and its content
  folded into the Terms; an empty result for "refund" would have read as "we
  have no policy", so `/terms` carries the keyword.
- Removed pages return nothing: `about this resource`, `study plan`, and the
  Refunds page itself.
- Nonsense (`zzzzqqq`) shows "Nothing matches …", not an empty panel.
- Clicking the Terms result navigated to `/terms`.

Five permanent gates added in `scripts/test/search.test.mjs`: every result is a
real page rather than a redirect; the four removed pages are named explicitly
and must not appear; every sidebar destination is indexed; the index carries no
answer, explanation or question body and does not import the question bank; and
a negative control.

---

## 5. Practice, tests and mocks

**Passed.**

- Practice on Latin Squares and Mathematical Equations: answering records the
  attempt, the dot turns green or red, the header pill appears, the grid fills
  in, feedback and explanation render.
- Quick practice: ten mixed questions, Figure Sequences SVG rendering correct.
- Mistakes route: lists exactly the questions currently wrong, empties as they
  are put right.
- Timed test end to end: briefing → clock → task navigator → flag → submit
  confirmation → results, with per-question timing recorded and the pace chart
  drawn from it.
- Results: score, per-subtest breakdown, "What you got wrong" open by default,
  "Retry the N misses".
- Four fixed mocks: all four reachable; hash lock
  `a468eb15875dd5404c6328f0be6913efdb93be5607e26c1397be9d9f1b8cb2a9`
  unchanged, 240 ids, 240 unique.

Question stability regressions from the previous pass remain covered by
`scripts/test/render-stability.test.mjs` (7 tests, negative controls included).

---

## 6. Dashboard and account

**Dashboard: passed.** Observed in both states with real data.

- Zero state: accuracy and streak show an em dash rather than 0% and 0 days —
  "0%" claims questions were answered and all were wrong. Counts show a true 0.
  The chart draws its real fourteen empty columns; the log and the plan have
  designed empty states; a guest is told where their work is kept.
- After one answer: 1 of 384 practised, a real accuracy, a 1-day streak, one
  chart cell, "Retry 1 mistake", and the question in the log with its time.

**Account: partially verified.** Now centred with consistent panels and three
sections. Identity, membership and progress all render from real data. The
erase-progress control shows its two-step confirmation; **the destructive path
was not run**, because doing so would have destroyed the practice history this
audit was using as evidence.

---

## 7. Razorpay test mode

**Partially verified — the payment itself was not completed.**

Verified:

- `.env.pilot` holds genuine Razorpay **test-mode** credentials. The key id
  carries the `rzp_test_` prefix; no value was printed, logged or committed.
- `npm run dev:pilot` validates the whole pilot configuration and reports
  `Razorpay mode test`, `commerce enabled`, `.env.local not used`.
- A pilot build was served on port 3002 with commerce on. On it:
  - `/checkout` renders with ₹999, lifetime access, the order summary and the
    before-you-pay disclosure.
  - Step 2 is gated behind step 1, so no payment button exists until signed in.
  - `POST /api/checkout/order` → **401** for an anonymous caller.
  - `GET /api/content/solutions` → **401** without an entitlement.
  - `/solutions/figure-sequences.json` served **50** entries, not 87 — the
    paywall withholds the paid half at the asset level.

**Not verified, and why.** Completing a test payment requires signing in with
Google through Supabase. That is the owner's own account and an interactive
OAuth consent; it cannot be done on their behalf. So steps 6–13 of the journey
— opening Razorpay's window, paying with a test instrument, returning,
verifying, activating Pro, and confirming it survives a refresh and a
re-login — **were not exercised**. Cancellation, failure, pending, duplicate
attempts and reconciliation were likewise not exercised against the provider.

No simulation was substituted. There is no client-side Pro flag and no fake
success path anywhere in the product.

### To complete it yourself

```bash
# stop the dev server on :3000 first — Next allows one dev server per project
npm run dev:pilot
```

Then open `http://localhost:3002`, sign in, go to Pricing → Unlock Pro →
Checkout, and use Razorpay's published test instruments. For the webhook half,
expose the port and point a test webhook at `/api/payments/webhook` with the
secret already in `.env.pilot`.

What remains unproven until then: entitlement granted from a real verified
payment, its persistence across a refresh and a re-login, and the provider-side
failure and pending paths.

---

## 8. Desktop and mobile

**Desktop (1440×1000): passed.** Dashboard, Prepare, Test, practice, exam
runner, results, pricing, checkout, account, About the Exam and Information.

**Mobile (390×844): passed, after one fix.**

> **Defect found and fixed.** The internal sidebar used `shrink-0`, so on a
> phone the column grew to its content width — 881px of links inside a 390px
> screen. The strip therefore had nothing to scroll and the **page** overflowed
> sideways instead, leaving headings cut off at the left edge. It is now
> full-width on mobile with the fixed column reserved for desktop, and the
> active section is scrolled into view one frame after layout. Verified on
> `/exam/scoring` and `/exam/sources`.

Also checked on mobile: the dashboard, the practice screen, the exam runner's
two-row dark header, and `/terms` inside the Information layout.

---

## 9. Errors

**Partially verified.**

- All 42 routes returned their intended status; none returned 5xx.
- The browser console was watched on every page opened during this audit —
  roughly twenty routes — and showed no application error. Entries seen were
  the Next dev overlay's own.
- **Not done:** an exhaustive automated console sweep of every route. It would
  have meant adding Playwright as a project dependency for one report, which
  the brief rules out. Console checking is therefore sampled, not exhaustive,
  and that is why this area is "partially verified" rather than "passed".
- No unhandled promise rejection, stuck loading state or inactive-looking
  control was observed in the flows exercised.

---

## 10. Defects found and fixed in this pass

| # | Defect | Fix |
|---|---|---|
| 1 | Sidebar Home used a dashboard glyph; the breadcrumb used a house | Both use the house |
| 2 | About the Exam kept a blue page gradient and a large filled blue panel | Gradient deleted with its unused class; updates panel rebuilt as a standard panel |
| 3 | About the Exam Overview repeated the internal sidebar as a card grid | Card grid removed |
| 4 | Internal sidebar overflowed the viewport on mobile | `w-full` on mobile; fixed column desktop-only |
| 5 | Sub-nav auto-scroll moved the whole page sideways | Scrolls only the strip, one frame after layout |
| 6 | Account page hung off the left edge | Centred measure via a new `centred` option |
| 7 | Removing `/about` broke a release check requiring a fuller independence statement | Statement relocated to `/information`; check now enforces it there |
| 8 | 13 components left dead by the revamp | Removed, iterating until stable |
| 9 | Searching "refund" returned nothing after the page was removed | `/terms` indexed under that keyword |

---

## 11. Removed in this pass

- **Refunds page.** Its substance is now a section of the Terms. `/refunds`
  redirects to `/terms`.
- **About this resource page.** Internal detail — pilot status and automated
  validation — that an ordinary candidate does not need. `/about` redirects to
  `/information`, which carries the independence statement in full.
- **Refund promotion.** No longer one of three selling points on Pricing, nor a
  footnote in the Pro dialog, nor an offer of assistance on Contact. It is
  stated once at checkout, before payment, and once in the Terms.
- **13 dead components.**

The refund policy itself changed, on instruction: Pro is delivered in full
immediately, so a change of mind is not refundable, while failures on our side
are. Checkout states this before the payment button and does not claim anything
about rights that exist in law regardless. **This wording has not been reviewed
by a lawyer** and no compliance claim is made for it.

---

## 12. Verification results

| Check | Result |
|---|---|
| `npm run lint` | clean |
| `npx tsc --noEmit` | clean |
| `npm run build` | compiled successfully |
| `npm test` | **488 tests, 486 pass, 0 fail**, 1 skipped, 1 todo |
| `npm run verify:content` | every content gate passed |
| `npm run release:check` | all 6 passed |
| `scripts/audit/run.mjs` | 384 active questions, 0 issues |
| `scripts/audit/negative-control.mjs` | 11 of 11 controls pass |

The one `todo` is pre-existing and unrelated to this pass: `/module-b/timed`
ships answer keys in its page payload. Module B is not in the paid offering.

---

## 13. Remaining blockers

1. **The Razorpay payment itself is unproven.** Everything up to the payment
   button is verified on real test keys; the payment, entitlement grant and its
   persistence are not. Needs an interactive sign-in. §7 has the commands.
2. **375 explanations have not been read by a person.** The audit verified
   every answer key independently and nine explanations by hand.
3. **Module B leaks answer keys** on `/module-b/timed`. Pre-existing, tracked,
   and confined to a module that is free and excluded from Pro.
4. **The legal text is not lawyer-reviewed**, including the changed refund
   wording and the operator's legal name, which is still unset.
5. **Console-error coverage is sampled**, not exhaustive.
