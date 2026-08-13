# Accounts, sync and persistence

dMAT Prep works completely without any of this. Supabase is optional
infrastructure: it adds durability across devices, and nothing else. With no
environment variables set the app builds and runs exactly as before — every
route static, every question in the bundle, progress in `localStorage`, and no
sign-in affordance rendered anywhere.

Read this before changing anything under `lib/progress/`, `lib/supabase/` or
`supabase/migrations/`.

---

## 1. Guest is a supported mode, not a degraded one

| | Guest | Signed in |
|---|---|---|
| Where progress lives | `localStorage` | Supabase, cached in `localStorage` |
| Practice, mocks, review | all of it | all of it |
| Survives a reload | yes | yes |
| Survives clearing site data | no | yes |
| Survives changing device | no | yes |

Nothing is gated. The only thing signing in buys is the bottom two rows, and
that is exactly how the product words the offer: **"Save your progress"**, never
"Create an account".

The invite appears at three moments and never anywhere else — after a
diagnostic, after a mock, and on Review once there are 15 or more attempts to
lose. Dismissing it is permanent (`dmat-prep:invite-dismissed:v1`).

---

## 2. Setting up a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local` and fill in the two values from
   **Project Settings → API**:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   The publishable key (formerly the "anon" key) is safe in the browser. Row
   level security, not key secrecy, is what keeps one candidate's attempts away
   from another's. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is still read as a fallback
   for projects that predate the rename.

   **The service-role key is never used by this app.** It bypasses row level
   security. Do not add it here or to the Vercel project.

3. Apply the schema (see §3).
4. Enable Google (see §4).
5. On Vercel, add the same two variables to the project and redeploy.

### Local development against a local Supabase

```bash
supabase start
supabase db reset        # applies everything in supabase/migrations
```

---

## 3. Database migrations

Schema lives in `supabase/migrations/` and is applied with the Supabase CLI:

```bash
supabase link --project-ref <ref>
supabase db push
```

Never create tables by hand in the dashboard. A schema that only exists in one
project cannot be reproduced, reviewed, or rolled back.

`lib/supabase/types.ts` is the hand-written mirror of these migrations. It is
not generated, because generating it needs a live project to introspect and this
repository has to build without one. **Change a migration and change that file
in the same commit.**

### Tables

| Table | Kind | Conflict rule |
|---|---|---|
| `profiles` | document | display name and avatar, nothing more |
| `attempts` | append-only | union by id; no update policy exists |
| `sessions` | working document | one row per session, from start to result |
| `question_exposure` | counter | max `times_seen`, earliest first, latest last |
| `user_state` | document | last write wins on `updated_at` |

Aggregates — accuracy, readiness, hint rate — are **never stored**. They are
derived from `attempts` on read, by the same functions the local store uses, so
the cloud and the browser cannot disagree about what a number means.

`sessions` deliberately carries its own restore state (`stages`, `answers`,
`stage_index`, `current_index`, `stage_ends_at`) rather than having a separate
`session_answers` table. Restoring is a single-row read, completing is a
single-row update, and there is no second place for the two to drift apart.

---

## 4. Google sign-in

1. In Google Cloud, create an **OAuth 2.0 Client ID** of type *Web application*.
2. Authorised redirect URI — the Supabase callback, not the app's:

   ```
   https://<ref>.supabase.co/auth/v1/callback
   ```

3. In Supabase, **Authentication → Providers → Google**: enable it and paste the
   client ID and secret.
4. In Supabase, **Authentication → URL Configuration**, add the app's own
   callback to *Redirect URLs*, for every origin it runs on:

   ```
   http://localhost:3000/auth/callback
   https://<your-domain>/auth/callback
   ```

### The flow

```
AccountMenu → signInWithOAuth({ provider: 'google' })   PKCE starts, verifier in a cookie
  → Google
  → https://<ref>.supabase.co/auth/v1/callback
  → /auth/callback  (app/auth/callback/route.ts)        exchangeCodeForSession, sets auth cookies
  → back to wherever sign-in was started, ?signed-in=1
```

`next` is validated as a relative path before use, so the callback cannot be
turned into an open redirect.

**There is no `proxy.ts`.** Its usual job is refreshing sessions for server
components, and this app has none that read auth: every page is static and reads
its data on the client, where the browser client refreshes its own tokens into
the same cookies the callback wrote. Adding one would make every request pay for
something nothing uses.

---

## 5. Sync strategy

The local store is the render source at all times, signed in or not. The cloud
layer writes *into* it rather than replacing it, so no component knows or cares
where the data came from — and answering a question never waits on a network
round trip.

```
answer a question
  → local store (synchronous, this is what the UI shows)
  → outbox: "this id has not reached the cloud yet"
  → debounced push, 2s
```

Four things trigger a sync, all in `components/auth/sync-provider.tsx`:

| Trigger | Does |
|---|---|
| signing in | pull, merge, push — this *is* the guest → account migration |
| tab becomes visible | pull, then push |
| coming back online | push |
| a write lands in the outbox | push, debounced 2s (60s backstop) |

### Conflicts

Decided by the kind of record, not by whichever side is newer:

- **attempts, sessions** — union by id. Both are statements about something that
  already happened, so neither side can invalidate the other's.
- **exposure** — per question and context: the larger `times_seen`, the earliest
  `first_seen_at`, the latest `last_seen_at`. Summing would double-count a row
  that has already synced.
- **active session** — last write wins on `updated_at`. Only one device can
  sensibly be sitting a mock.
- **milestones, key dates** — last write wins, compared against the database's
  own `updated_at`, which a trigger maintains. A device with a wrong clock
  cannot win by claiming to be from next year.

### Idempotence

Every attempt carries a client-minted id, and every write is an upsert on the
primary key. A retried push therefore collides and is ignored rather than
counting an answer twice. This is also why the outbox is cleared only *after*
the server accepts the rows, and why an interrupted sign-in can simply be run
again — merging twice produces the same result as merging once.

### Failure

A failed write leaves the outbox untouched and the answer in place locally.
Nothing blocks, nothing is lost, and the account menu shows one line —
`N waiting to sync` — rather than an error the candidate can do nothing about.

---

## 6. Reload safety

A refresh must never silently cost work. Two mechanisms, because two situations
deserve different treatment:

**Mocks, timed practice, the diagnostic** — the runner writes a restore point on
every answer and every move (`ProgressState.activeSession`). Coming back offers
**Resume** or **Start over**; it never decides for you, because starting over
discards both the answers and the only unseen questions left in the bank.

Timing is stored as an absolute `stageEndsAt`, never a remaining-seconds
counter. A counter is meaningless once the browser has been closed for ten
minutes; a deadline can still be compared against the clock on the way back in.
If it has already passed, the session is marked expired and goes to submission
with the answers it had — announced, not silently.

**Practice and quick practice** — restored silently
(`ProgressState.practiceDrafts`), including the current question, the selected
option, the hints already opened, and the difficulty filter. A mock is a
commitment worth confirming; an untimed practice run is not.

A draft or session whose questions are no longer in the bank — after a
regeneration — is discarded rather than half-restored.

---

## 7. Question exposure

Three contexts, tracked independently, because they must not consume each other:

| Context | Fed by |
|---|---|
| `practice` | practice, quick practice |
| `diagnostic` | the diagnostic |
| `mock` | timed practice **and** the full simulation |

Meeting a question in the diagnostic must not disqualify it from a mock, where
unseen material is the entire point. Within a mock the ranking is: never seen
anywhere → met in another context → already spent from this pool → used by the
immediately previous session. So practice never *empties* the mock pool, it only
makes those questions second choice.

`timed` and `simulation` share the `mock` context deliberately: a single-subtest
mock and the full simulation are the same kind of exposure.

---

## 8. Row level security

Every user-owned table has RLS enabled, with policies scoped `to authenticated`.
The anonymous role has no access at all, which is correct: guests never touch
these tables.

- `user_id` defaults to `auth.uid()`, and every `with check` clause refuses an
  insert claiming a different owner — a forged `user_id` in a request body
  cannot write a row.
- `attempts` has **no update policy**. An attempt is a statement about something
  that already happened; rewriting one would silently change every derived
  figure in the product. Insert, select and delete only.
- Deleting an account cascades to every table through
  `references auth.users (id) on delete cascade`.

Authorisation is never a frontend concern here. The client's identity comes from
the Supabase session, and the database decides what that identity may read.

---

## 9. Storage keys

| Key | Holds |
|---|---|
| `dmat-prep:progress:v1` | the whole `ProgressState` (schema version inside) |
| `dmat-prep:outbox:v1` | ids written locally but not yet accepted by the cloud |
| `dmat-prep:migrated-for:v1` | the user id this browser has already merged into |
| `dmat-prep:documents-touched:v1` | when milestones/key dates last changed locally |
| `dmat-prep:invite-dismissed:v1` | the sign-in invite was waved away |

No secrets are ever written to `localStorage`. Auth tokens live in cookies,
managed by `@supabase/ssr`.

Signing out clears this browser's cache of the account's progress. The cloud
keeps everything; what goes is the local copy, so a shared machine does not
leave one person's attempts on screen for the next.

---

## 10. Schema versions

`ProgressState.version` is currently **2**. A v1 store — no attempt ids, no
exposure log — is upgraded on read by `lib/progress/migrate.ts`:

- every attempt gets a **deterministic** `legacy:<mode>:<questionId>:<at>` id, so
  the same record produces the same key on every device and cannot be inserted
  twice by the merge;
- the exposure log is rebuilt from existing attempts and completed sessions, so
  nobody's mock pool resets on the day they upgrade.

Nothing is discarded. An unrecognisable store degrades to empty rather than
throwing, because a hand-edited value should cost history at worst, never the
ability to open the app.
