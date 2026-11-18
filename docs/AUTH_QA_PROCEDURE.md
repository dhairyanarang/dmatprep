# Auth and cloud-sync QA — procedure

**Not run. Prepared and stopped, deliberately.**

The end-to-end auth and sync journeys remain the largest unverified area of this
product. This document is what makes them runnable the moment an isolated
project exists; it is not a substitute for running them.

## Why it was not run

A disposable Supabase project was not available, and the three routes to one
were all closed:

| Route | Status |
|---|---|
| Local stack (`supabase start`) | **Docker is not running** on this machine, and `supabase/` holds only migrations — no `config.toml`, so the stack is not initialised either. |
| A new cloud project via the CLI | The Supabase CLI is installed (2.114.0) but holds no access token. Creating a cloud project spends quota and creates outward-facing resources, which needs explicit approval. |
| The existing project | **This is production.** `.env.local` points at it, it is what the running app uses, and signing in would create a real user record. Out of scope by instruction and by judgement. |

So the instruction was followed to the letter: prepare the procedure, and stop
before connecting to production.

## What protects against running it against production anyway

`npm run qa:assert-isolated` stands in front of every test below and exits
non-zero unless isolation is proved. It hardcodes nothing: production is
whatever `.env.local` points at, the QA target is whatever `.env.qa.local`
points at, and it refuses if they are the same project.

Verified against three cases, with the output in each:

| Case | Result |
|---|---|
| No `.env.qa.local` | Refuses, and says how to make one. |
| `.env.qa.local` pointed at production | **Refuses** — "The QA project (phkj…) is the SAME project as the one in .env.local." |
| A separate project, but carrying a service-role key | **Refuses** — a service-role key bypasses RLS entirely, so the RLS tests would prove nothing. |
| A separate project with only a publishable key | Passes, and prints both project refs truncated so a human can tell them apart. |

`.env.qa.local` is covered by `.env*` in `.gitignore`, so it cannot be
committed. No project ref or key is printed in full.

## Setting the isolated environment up

1. **Create a new Supabase project.** Any region; the free tier is sufficient.
   Name it so it is obviously disposable — `dmatprep-qa-throwaway`.
2. **Apply the schema.** Two migrations define everything:
   ```bash
   supabase link --project-ref <the-new-ref>
   supabase db push
   ```
   `supabase/migrations/20260813120000_init_progress.sql` creates the five
   tables and their RLS policies;
   `20260813150000_revoke_trigger_fn_execute.sql` revokes execute on the
   trigger function.
3. **Enable Google as an auth provider** in the new project, with its own OAuth
   client. Do **not** reuse production's client id or secret.
4. **Write `.env.qa.local`:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<the-new-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<the new project's publishable key>
   ```
   Only those two. No service-role key — the guard refuses one, and the tests
   are meant to run as an ordinary user so that RLS is actually exercised.
5. **Prove isolation before anything else:**
   ```bash
   npm run qa:assert-isolated
   ```
6. **Run the app against it**, without disturbing `.env.local`:
   ```bash
   env $(grep -v '^#' .env.qa.local | xargs) npm run dev
   ```

## The test matrix

Each row says what to do and what would count as a failure. Browser-tested and
automated results must be reported separately — a passing unit test is not a
tested journey.

### Registration and session

| # | Test | Fails if |
|---|---|---|
| 1 | Sign in with Google from a clean browser profile | No `profiles` row is created, or the redirect lands anywhere but the page you started from |
| 2 | Reload while signed in | The session does not survive; the sign-in affordance returns |
| 3 | Sign out | The local progress copy is cleared, the cloud copy is not, and the sign-in affordance returns |
| 4 | Sign back in | The cloud copy returns intact |
| 5 | Open a second browser profile and sign in as a **different** Google account | Either account can see the other's attempts — this is the RLS test and the most important row here |
| 6 | Callback with no `code` | Anything but a redirect to `/?auth-error=1` |
| 7 | Callback with `?next=https://evil.example.com` | The redirect follows it rather than refusing |

### Guest-to-account migration

| # | Test | Fails if |
|---|---|---|
| 8 | Answer 5 questions as a guest, then sign in | Fewer than 5 attempts exist afterwards, or more than 5 |
| 9 | Sign in on a second device with different guest work | Either device's attempts are lost |
| 10 | Answer as a guest, sign in, sign out, sign in again | The count changes at any step |
| 11 | Start a mock as a guest, sign in mid-session | The session in progress is discarded |

### Sync, retry and interruption

| # | Test | Fails if |
|---|---|---|
| 12 | Answer with the network throttled to offline, then restore it | The attempt is lost, or appears twice |
| 13 | Answer offline, reload before the network returns, then restore it | The outbox does not drain |
| 14 | Force the same push twice (devtools → replay the request) | A duplicate attempt row appears; every push is an upsert on a client-minted id, so it must not |
| 15 | Kill the tab mid-sync, reopen | The outbox resumes rather than starting clean |
| 16 | Answer the same question on two devices simultaneously | Either answer is lost; attempts union by id |

### Derived figures

| # | Test | Fails if |
|---|---|---|
| 17 | Compare accuracy before and after a sync | It changes — aggregates are derived from attempts, never stored |
| 18 | Compare exposure counts after syncing twice | `timesSeen` doubles; the merge takes the maximum, never the sum |

## What has been verified without connecting

Reported separately because it is not the same thing as having run the journeys.

**Automated, 11 tests** (`scripts/test/progress-merge.test.mjs`) over
`lib/progress/merge.ts`, which is the logic rows 8–18 exercise:

- attempts and sessions union by id, so neither side drops the other's
- the same attempt synced twice stays one attempt
- merging is order-independent
- an empty side never erases the other, in either direction
- exposure takes the maximum, never the sum, and keeps the earliest first-seen
  and the latest last-seen
- exposure stays keyed per context
- the active session is last-write-wins and survives a null on either side
- a guest with work signing into an account with work loses nothing, and doing
  it twice changes nothing

**Probed against a running server**, which covers rows 6 and 7:

- `/auth/callback` with no code → `307` to `/?auth-error=1`
- `/auth/callback?next=https://evil.example.com/` → refused the same way rather
  than followed

**Not verified by anything:** rows 1–5 and 8–18 as journeys. The merge logic
being correct is not evidence that the app invokes it correctly, that RLS is
enforced on the live schema, or that the outbox drains after a real network
interruption.
