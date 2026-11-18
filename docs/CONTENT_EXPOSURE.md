# Content exposure: what leaks, what a server fixes, and what it cannot

Measured 14 November 2026 at commit `8ea601d`. Every number here came from a
command, not an estimate; the commands are given so they can be re-run.

## 1. Three problems, routinely conflated

They have different causes and only one of them is a code problem.

| | Problem | Cause | Fixable in this codebase? |
|---|---|---|---|
| **A** | Answers and teaching content reach the browser before the candidate answers | The client grades, so it must hold the key | **Yes** — payload split + server grading |
| **B** | Questions intended for premium reach clients with no entitlement | Prerendering cannot know who is asking | **Yes, but only with a server** |
| **C** | The whole bank is in a public Git repository | It is committed | **No.** Not by any application change |

Fixing A and B while C stands is theatre. Sequence accordingly.

## 2. Measurements

### A — the public payload

```
GET /practice/quick   (anonymous)   HTTP 200   2,956,476 bytes
  explanation       × 473
  distractorNotes   × 473
  correctOptionId   × 646
  premium-intended ids present: 323 of 323
```

`correctOptionId` exceeds the question count because each Figure Sequences item
has two images and each image carries its own key. 646 is the measured peak and
is the baseline the CI ratchet enforces.

Share of the bank that is answer or teaching content, rather than the question
itself:

| Section | Items | Bank | Solution/teaching | Share |
|---|---|---|---|---|
| Figure Sequences | 173 | 1,440 KB | 867 KB | 60% |
| Mathematical Equations | 175 | 571 KB | 366 KB | 64% |
| Latin Squares | 125 | 538 KB | 413 KB | 77% |
| **Total** | **473** | **2,549 KB** | **1,646 KB** | **65%** |

Two thirds of the payload is content the candidate should not have yet. Removing
it is also the single largest performance win available on these routes.

### C — the public repository

```bash
curl -sI https://raw.githubusercontent.com/dhairyanarang/dmatprep/main/content/sections/figure-sequences/questions.json
```

| Path | Status | Bytes |
|---|---|---|
| `content/sections/figure-sequences/questions.json` | **200** | 2,893,191 |
| `content/sections/mathematical-equations/questions.json` | **200** | 879,211 |
| `content/sections/latin-squares/questions.json` | **200** | 853,373 |

4.6 MB, fetchable by anyone, no authentication, and has been since 2026-08-11 —
95 days.

## 3. The finding that matters most

**The existing 473 questions cannot be made scarce again.**

They are in the public history of a public repository and have been for three
months. Making the repository private now does not retract them: clones, forks,
the GitHub API's archive endpoints and third-party mirrors are all outside our
control, and rewriting history does not reach any of them. There is no
cryptographic or architectural step that restores scarcity to bytes already
published.

This contradicts the current freemium plan, which sells 323 of these 473 as
premium. That plan should change, and the change is not a loss:

- **Free tier: all 473 Core questions.** They are already public. A free tier of
  473 verified, solver-checked questions with explanations is a genuinely strong
  acquisition asset, and it is considerably more generous than the planned 150.
- **Premium: content authored after the store is private, plus the features.**
  Mocks, timed sessions, analytics and the GAM packs are *product*, not bank
  bytes. None of them is leaked by a public `questions.json`, so all of them are
  sellable today. Only new questions need the private store.

Reframed this way, the delivery work in §4 protects content that does not exist
yet — which is the right time to build it, and the only time it can work.

## 3.5 What was built, and what it is not

**Status, 18 November 2026: problem A is fixed for Core. B and C are not.**

Pages now serve `getPublicQuestions` — stems, options, panels, grids and hints,
with nothing that answers them — and the solutions are written to
`public/solutions/<section>.json` and fetched by the browser, merged back by
`lib/solutions/use-solutions.ts` so every component downstream still sees a
complete question.

Measured against the production build:

| | Before | After |
|---|---|---|
| Payloads carrying answer content | 73 of 215 | 37 of 215 |
| Peak answer-bearing keys in one payload | 2,197 | 38 |
| Worst Core practice route | 387 explanations, 474 keys | **0** |

**This is hygiene, not protection, and the distinction is the whole point.**
`public/solutions/figure-sequences.json` is a static asset at a predictable URL.
Anyone can fetch it. Nothing about separating a file, or giving it an
unguessable name, makes its contents private.

That is the right level for the Core bank, which is free and has been in a
public Git repository since August. It is **not** the right level for anything
sold. Premium content must never be a static asset and must never rely on an
obscure URL: it has to be delivered by a route handler, after a server-side
entitlement check, as §4 sets out. If a future change treats
`public/solutions/` as a paywall, it has misread this document.

What remains exposed and why:

- **Module B** was not split and still ships its answers and explanations. It is
  a labelled pilot, not signed off by anyone, and is not sold.
- **The section guides' worked examples** ship their answers, because showing
  the answer is what a worked example is.

## 4. The smallest delivery that is actually secure

Two route handlers and one private store. Nothing more.

### 4.1 A private content store

Premium questions never enter Git. A `premium_questions` table in the existing
Supabase project with **no RLS policy at all** — absence of a policy is denial,
so no client key can read it — reachable only by the service role from a route
handler. This adds no vendor and no new secret beyond the service-role key that
the project already has.

Why not a private Git submodule or a storage bucket: both end up on a build
machine, which means the bytes land in the build output again unless every
consumer is audited. A table that the client's own key cannot read fails safe by
default.

### 4.2 `POST /api/questions`

Returns questions with every answer-bearing field removed server-side. Route
handlers are uncached by default in Next 16, so this runs at request time with
no configuration (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`:
"Route Handlers are not cached by default"). Do **not** add
`dynamic = 'force-static'` here; that is exactly the bug this is fixing.

The allowlist is positive, not a denylist. Fields served:

- Figure Sequences — `given`, `images[].options`, `grid`. Never `rules`, never
  `images[].correctOptionId`.
- Mathematical Equations — `equations`, `variables`, `asked`, `options`. Never
  `solution`, never `solutionSteps`.
- Latin Squares — `size`, `letters`, `grid`, `target`, `options`. Never
  `solutionSteps`, never `forcedPlacementDepth`.
- All — `id`, `section`, `difficulty`. Never `explanation`, `distractorNotes`,
  `hints`, `walkthrough`.

A denylist would ship the next field somebody adds. Enforce the allowlist with a
test that fails when a new key appears on `QuestionBase` without a decision.

### 4.3 `POST /api/attempt`

`{ questionId, selection }` in; correctness, the explanation and the
distractor note **for the option actually chosen** out. The server grades.

This is the inversion that makes the rest work. Today the client calls
`isCorrect()` from `lib/types/question.ts:341`, which is why the key has to be
in the browser. No amount of obfuscation substitutes: a salted answer hash
shipped to the client is defeated by hashing all three or four options, which
takes microseconds. **Do not ship a hash-comparison scheme** — it looks like
protection and provides none.

### 4.4 What this costs, and the invariant it breaks

CLAUDE.md states that answering a question never waits on the network. For
premium content that stops being true: grading becomes a round trip, realistically
100–250 ms.

Mitigation, not a workaround: keep the write local-first exactly as now. The
selection is recorded in `ProgressStore` and the outbox the moment it is made,
the UI shows a checking state, and the verdict reconciles when it lands. A
dropped connection delays the verdict; it never loses the attempt. The outbox,
the client-minted ids and the upsert-only push already exist for precisely this
shape of problem.

Free content keeps grading locally. It is public; there is nothing to protect,
and the instant-feedback behaviour is worth keeping where it costs nothing.

## 5. Static-route assumptions that must change

Stated precisely, because the invariant in CLAUDE.md is load-bearing and should
be amended rather than quietly broken.

1. **"Every route is static; nothing needs a server at request time."**
   Becomes: *every page is static; the route handlers under `/api` run at request
   time.* The precedent already exists — `app/auth/callback/route.ts` is the only
   request-time code in the app today, and it has not compromised the page
   routes.

2. **Practice pages stop receiving questions as props.**
   `app/practice/quick/page.tsx` currently builds a `Record<SectionId, Question[]>`
   at build time and hands it to `<QuickLauncher>`. That one line is the leak.
   Premium routes become a prerendered shell that fetches on mount. The shell is
   still static and still on the CDN; only the data moves.
   Affected: `app/practice/quick`, `/diagnostic`, `/simulation`, `/timed/[section]`,
   `app/module-a/[section]/practice`.

3. **`lib/content/registry.ts` must split.**
   `getQuestions()` returns full records including answers and is callable from
   anywhere. Split into a public accessor safe for prerender and a server-only
   module carrying the `server-only` import guard, so a future client import is a
   build error rather than a leak. `lib/search/entries.ts:14` already routes
   around the registry for this exact reason — the hazard is known, it just is not
   enforced.

4. **`getBankSize()` stays as it is.** Four pages use it for counts. A count is
   not content.

5. **The CI ratchet changes meaning.** `EXPOSURE_BASELINE = 646` in
   `scripts/test/content-exposure.test.mjs` should fall as this lands, and the
   `todo`-marked zero-exposure gate becomes the real assertion. The ratchet test
   asserts `peak > 0` on purpose, so it fails once exposure reaches zero — that
   failure is the signal to delete it and promote the todo.

6. **Vercel.** Pages stay prerendered on the CDN; two functions appear. Default
   Fluid Compute, Node runtime, no edge runtime and no configuration change. The
   functions need the service-role key as an environment variable, which must be
   server-scoped and must never be prefixed `NEXT_PUBLIC_`.

## 6. Sequencing

1. **C first, and it is a decision, not a task.** Until the bank is out of public
   reach, A and B buy nothing. This needs an explicit call on repository
   visibility, and it does not restore the 473 — see §3.
2. **Re-plan the tiers** on the basis that the existing bank is public. Free gets
   all 473; premium gets features now and new content later.
3. **Then the store and the two handlers**, for new content only.
4. **Then the payload split** on the routes in §5.2, dropping the baseline as it
   goes.

Steps 1 and 2 need a product decision before step 3 is worth writing.
