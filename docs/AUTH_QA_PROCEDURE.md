# Auth and cloud-sync QA — procedure

**Not run. Prepared and stopped, deliberately.**

The end-to-end auth and sync journeys remain the largest unverified area of this
product. This document is what makes them runnable the moment an isolated
project exists; it is not a substitute for running them.

## Why it has not been run — re-checked 18 November 2026

Nothing has changed since Sprint 3, and the position was re-tested rather than
assumed:

| Route | Status on 18 Nov 2026 |
|---|---|
| Local stack (`supabase start`) | **No container runtime exists on this machine at all.** The `docker` binary is absent, not merely stopped; `colima` and `podman` are absent too. `supabase/` holds only migrations — no `config.toml`, so the stack is not initialised either. |
| A new cloud project via the CLI | CLI present (2.114.0) but holds no access token. Creating a cloud project spends quota and creates outward-facing resources, which needs explicit approval. |
| The existing project | **This is production.** `.env.local` points at it, it is what the running app uses, and signing in would create a real user record. |

**The local stack is the recommended path** and §A below is the exact setup. It
costs nothing, creates no cloud resources, cannot reach production, and can be
destroyed with one command. The only reason it has not been used is that the
machine has no way to run a container.

---

## A. Setting up the local stack — the recommended route

Fastest when the operator is at the machine. Everything stays on the laptop.

**A1. Install a container runtime.** Either is fine:

```bash
# Docker Desktop — the usual choice
brew install --cask docker && open -a Docker

# or Colima — lighter, no GUI, no licence question for commercial use
brew install colima docker && colima start
```

Confirm with `docker info`. That command currently fails because no runtime is
installed.

**A2. Initialise the stack.** `supabase/` has migrations but no `config.toml`:

```bash
supabase init     # writes supabase/config.toml — commit it
supabase start    # pulls the images and brings up Postgres, Auth, Storage
```

`supabase start` prints an API URL (usually `http://127.0.0.1:54321`), an anon
key and a service-role key. **Only the first two go in `.env.qa.local`.**

**A3. Apply the schema.**

```bash
supabase db reset   # runs every migration in supabase/migrations against the local db
```

That applies `20260813120000_init_progress.sql` — five tables and their RLS
policies — and `20260813150000_revoke_trigger_fn_execute.sql`.

**A4. Write `.env.qa.local`:**

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<the anon key supabase start printed>
```

**A5. Prove isolation, then run the app against it:**

```bash
npm run qa:assert-isolated
env $(grep -v '^#' .env.qa.local | xargs) npm run dev
```

**A6. Tear down when finished:** `supabase stop --no-backup`.

### The one thing the local stack cannot test

**Google OAuth.** The app's only sign-in path is Google, and the local stack has
no Google OAuth client. Two options:

- **Configure a test OAuth client** in Google Cloud Console pointed at
  `http://127.0.0.1:54321/auth/v1/callback`. This tests the real path.
- **Or** enable email/password on the local stack and drive the data layer
  directly — which exercises RLS, the outbox, the merge and the retry behaviour
  (rows 8–18 of the matrix) but **not** rows 1–5, the sign-in journey itself.

The second is much faster and covers the rows where a bug costs a candidate
their work. The first is the only way to close rows 1–5. Both should happen
eventually; the second is worth doing first.

## B. The cloud alternative, if the operator prefers it

Slower and it creates billable resources, but it is the only route that
exercises a real hosted Postgres and a real Google OAuth client end to end.

Steps:

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
