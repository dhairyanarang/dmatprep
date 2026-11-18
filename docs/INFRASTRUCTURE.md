# Infrastructure, privacy and operational readiness

Audited 18 November 2026 against the repository and the production build.

**Status legend.** ✅ implemented and tested · 🟡 implemented, not end-to-end
tested · ⚠️ gap, work needed · ⛔ blocked on a decision or on advice

---

## 1. Application architecture

| Area | Status | What is actually there |
|---|---|---|
| Routing | ✅ | App Router, 41 prerendered routes. One request-time handler: `app/auth/callback/route.ts`. No `middleware.ts`, no `proxy.ts`, no `app/api`. |
| Rendering | ✅ | Every page static. The invariant holds and is what makes the site cheap and fast — and what makes server-side entitlement a genuine change, not a tweak. |
| Design system | ✅ | Tokens in `app/globals.css`, one light theme, shadcn on Base UI. |
| Error boundaries | ✅ | `app/not-found.tsx` and `app/global-error.tsx` added 18 Nov 2026. Before that there were none. |
| Loading states | 🟡 | No route-level `loading.tsx`. Components handle their own (`!ready`, `!solutions.ready`). Adequate because everything is static; a `loading.tsx` would rarely show. |
| Authentication | 🟡 | Google OAuth only, via `@supabase/ssr`. PKCE handled in `auth/callback`. **Never tested end to end** — see §3. |
| User profiles | 🟡 | `profiles` table, RLS self-scoped. Name, email, avatar from Google. |
| Guest progress | ✅ | `localStorage` under `dmat-prep:progress:v1`, read through `useSyncExternalStore`. Verified in a browser repeatedly, including across reloads. |
| Authenticated progress | 🟡 | Local store stays the render source; the cloud layer writes into it. Merge logic has 11 tests. The *path* is untested. |
| Cloud sync and outbox | 🟡 | Local-first, outbox-queued, client-minted ids, upsert-only. Union-by-id merge tested; real interruption and retry untested. |
| Question delivery | ✅ | `getPublicQuestions` serves answer-free records; solutions fetched from `public/solutions/*.json` and merged client-side. Zero answer keys on any Core practice route, measured. |
| Mock and timed flows | ✅ | Diagnostic, simulation, per-section timed, GAM timed. Absolute `stageEndsAt`, restore points, resume prompts. Browser-tested. |
| Analytics | ✅ | Microsoft Clarity, gated on `VERCEL_ENV === 'production'` so previews and localhost are excluded at build time. No `identify()`, no custom tags, email masked with `data-clarity-mask`. |
| Configuration | ✅ | Two public Supabase variables, both optional. Guest mode is a first-class mode: with neither set, no sign-in affordance renders and no client opens. |
| Build | ✅ | `npm run verify:content` — solutions, bank, GAM gates, lint, build, release checks, 341 tests. Wired into CI. |
| Deployment | 🟡 | Vercel. No `vercel.json`; `next.config.ts` carries two redirects and a pinned Turbopack root. No preview-vs-production config beyond `VERCEL_ENV`. |

### Gaps worth naming

- ⚠️ **No security headers.** `next.config.ts` sets none — no CSP, no
  `X-Frame-Options`, no `Referrer-Policy`, no `Permissions-Policy`. Vercel
  supplies some defaults but not a CSP. For a static site with one OAuth
  redirect this is moderate rather than urgent, but it is free to fix and
  should be fixed before money changes hands.
- ⚠️ **No `vercel.json`.** Everything is defaulted. Fine today; worth pinning
  once there are route handlers whose region and runtime matter.

## 2. Privacy and data protection

### What is collected

| Data | When | Where it lives |
|---|---|---|
| Attempts, exposure, sessions, drafts | Always | `localStorage` for a guest; also Supabase when signed in |
| Name, email, avatar | Only on sign-in | `profiles`, Supabase |
| Behavioural replay | Production only | Microsoft Clarity |

**A guest is genuinely anonymous.** Nothing is transmitted. Clearing browser
data deletes everything and we cannot recover it because we never had it.

### Assessment

| Item | Status | Finding |
|---|---|---|
| Data minimisation | ✅ | Only what the product needs. No phone, no address, no payment data today. |
| RLS | 🟡 | 17 policies across five tables, all self-scoped with `(select auth.uid()) = user_id`. `attempts` deliberately has **no update policy** — immutability. **Never tested against a live database with two real accounts.** |
| Service-role key | ✅ | Not read anywhere. `.env.example` says in terms that it must never be added. |
| Secrets in the bundle | ✅ | Only `NEXT_PUBLIC_*` reach the client, both publishable by design. |
| Cookies | 🟡 | Supabase auth cookies only, set by `@supabase/ssr`. No analytics cookie banner — Clarity sets its own. |
| Local storage | ✅ | Three keys, all namespaced `dmat-prep:`. |
| Analytics consent | ⚠️ | Clarity loads on production without asking. Disclosed on `/privacy`, but disclosure is not consent. See §2.1. |
| Privacy notice | 🟡 | `/privacy` is accurate and readable, and deliberately short. It does **not** meet the DPDP Act's formal requirements — the gaps are listed in `docs/legal/privacy-policy.md`. |
| **Right to erasure** | ⚠️ | **No self-service deletion.** Sign-out clears the local copy only. Deletion is by emailing a personal address. The schema supports it — `attempts`, `sessions` and `exposure` all have delete policies — but nothing in the product exposes it. |
| Error logging | ✅ | No logger ships personal data. The new global error page surfaces Next's `digest`, which is an opaque hash and carries no user data. |
| Publicly exposed data | ✅ | `public/solutions/*.json` is question content, openly fetchable by design and documented as such. No user data is public. |

### 2.1 The two that need qualified advice

**Analytics consent.** Clarity records session replays, including the questions
on screen and the options chosen. It loads on first paint in production with no
consent step. India's DPDP Act is built on consent, and a candidate in the EU
would raise GDPR questions this product has never considered. **Whether a
consent mechanism is required — and of what kind — is a question for a lawyer**,
and it is cheaper to answer before launch than after.

**Children.** The DPDP Act requires verifiable parental consent for users under
18 and restricts behavioural tracking of them. The audience is postgraduate
applicants, so realistically adults — but nothing checks, and Clarity is
behavioural tracking. Flagged in the privacy draft and unanswered.

## 3. Authentication and cloud sync

**This is the largest unverified area in the product, and it has not moved.**

Re-checked today: the machine has **no container runtime at all** — the
`docker` binary is absent, and so are `colima` and `podman` — so `supabase
start` is impossible. The CLI is installed but holds no access token, so a cloud
project needs approval and spends quota. The only configured project is
production.

| Journey | Evidence |
|---|---|
| Merge logic — union by id, idempotent retry, per-context exposure, last-write-wins | ✅ 11 automated tests |
| `/auth/callback` with no code → `/?auth-error=1` | ✅ probed against a running server |
| `/auth/callback?next=https://evil.example.com` refused | ✅ probed |
| Registration, login, logout, session persistence | ⛔ untested |
| Invalid and expired sessions | ⛔ untested |
| Guest-to-account migration as a journey | ⛔ untested |
| Cloud sync, duplicate pushes, interruption and recovery | ⛔ untested |
| **RLS isolation between two real accounts** | ⛔ **untested — the one that matters most** |
| Cross-device consistency | ⛔ untested |
| Account deletion behaviour | ⛔ untested, and unimplemented |

`docs/AUTH_QA_PROCEDURE.md` now carries the exact local-stack setup (install a
runtime, `supabase init`, `supabase start`, `supabase db reset`) and the cloud
alternative, plus an 18-row matrix. `npm run qa:assert-isolated` refuses to run
against production and was re-verified today.

**Authentication and sync must not be described as complete.** The merge logic
being correct is not evidence that the app invokes it correctly, that RLS holds
on a live schema, or that the outbox drains after a real interruption.

## 4. Operational readiness

| Area | Status | Finding |
|---|---|---|
| Error monitoring | ⚠️ | **None.** No Sentry, no Vercel error alerting configured in-repo. A production exception is visible only in Vercel's logs if someone looks. |
| Build checks | ✅ | One command, wired into CI, fails closed. |
| Backup and recovery | ⚠️ | Supabase's own backups only, on whatever the project's tier provides. No documented restore expectation and no one has tested a restore. |
| Incident response | ⚠️ | Undocumented. No severity definitions, no rollback runbook. Vercel's instant rollback exists and nobody has rehearsed it. |
| Support route | 🟡 | A personal Gmail, now published on `/about` and the error page. Adequate for a free beta; poor once it doubles as a grievance address under the Consumer Protection (E-Commerce) Rules. |
| User-facing errors | ✅ | 404 and 500 added today, both with a route out. The solutions-fetch failure has its own message and is browser-tested. |
| Product metrics | 🟡 | Clarity gives behaviour. No funnel, no conversion events — which will matter the moment there is a checkout. |
| Admin visibility | ⚠️ | **None exists.** No admin UI, no dashboard, no way to look up a user's state without the Supabase console. Acceptable at this size; name it rather than discover it during an incident. |

### Minimum viable launch checklist

Ordered. Nothing here is invented — each item is either absent today or
present and untested.

**Before any paid transaction**

1. ⛔ Auth and sync tested against an isolated backend, RLS isolation included.
2. ⛔ Terms, privacy and refund policies published and legally reviewed.
3. ⚠️ A support address that is not a personal mailbox.
4. ⚠️ Error monitoring, so a failure is noticed without someone looking.
5. ⛔ The §9.1 copyright question answered.

**Before public promotion**

6. ⚠️ Security headers, CSP included.
7. ⚠️ Self-service account deletion, or a documented and honoured manual process.
8. ⚠️ A consent decision on analytics.
9. 🟡 A tested rollback.

**Can safely wait**

10. Admin tooling — the Supabase console is enough at this size.
11. Conversion analytics — needed when there is something to convert.
12. `vercel.json` — defaults are fine until route handlers exist.
13. `loading.tsx` — everything is static.

---

## 5. The QA blocker — a decision, with a recommendation

**The blocker.** No container runtime is installed, so `supabase start` cannot
run and the local stack in `docs/AUTH_QA_PROCEDURE.md` §A cannot be brought up.
This blocks two things at once: auth and cloud-sync QA (item 1 of the launch
checklist), and Phase 2 of the payments build (`docs/ENTITLEMENT.md` §15).

**Production is not an option for either.** Not as a fallback, not briefly, not
with a test account. The brief forbids it and so does the existing procedure.

### The two options

| | **A. Local container runtime** | **B. Separate staging Supabase project** |
|---|---|---|
| What it is | Install Docker or Podman; `supabase start` | A second free-tier cloud project, used only for QA |
| Cost | Free. ~1–2 GB of disk, plus memory while running | Free tier, second project on the same account |
| Data isolation | **Total** — nothing leaves the machine | Good — separate project, separate keys, separate URL |
| Can test Google OAuth | ⛔ **No.** Already documented: the one thing a local stack cannot do | ✅ **Yes** — a real redirect URI against a real provider |
| Migrations | `supabase db reset` from `supabase/migrations/` | Applied by push, or by hand |
| Destructive reset | Trivial and instant | Slower, and a mistake is remote |
| Risk of hitting production | Near zero — a local URL cannot be confused for a cloud one | **Non-trivial.** Two cloud projects, two similar URLs, two sets of keys |
| Needs approval | No. A local tool install | **Yes** — creating and connecting a project |

### Recommendation: A, then B only if OAuth must be tested end-to-end

**Install a local container runtime.** Three reasons, in order of weight:

1. **It needs no approval and creates nothing.** It is a developer tool
   install, fully reversible, and it touches no account and no cloud resource.
2. **It is the safer place for the payments work.** Phase 2 and 3 involve a
   service-role key with write access to entitlement tables. A local key that
   cannot reach any hosted project is a materially better place to make the
   first mistakes than a second cloud project whose URL differs from
   production's by a few characters.
3. **`supabase db reset` makes the schema disposable**, which is exactly what an
   unapproved, iterating migration needs. `docs/ENTITLEMENT.md` §13.1 is a clean
   drop precisely because nothing depends on it yet — and that is only cheap
   locally.

**What A cannot do, and when B becomes necessary.** Google OAuth. The procedure
already records this as the one thing the local stack cannot test, because the
redirect URI must be reachable by Google. Everything else — RLS isolation,
cross-user access, the guest → account merge, the outbox, and all of the
payments work — runs locally.

So the honest sequence is: **A now, unblocking both workstreams; B later, scoped
to the OAuth flow alone, and only with approval.** B is not a substitute for A
and A is not a substitute for B; they test different things, and only one of
them is needed to start.

**What I am not doing without approval:** creating a Supabase project,
connecting one, or installing anything. A is a recommendation awaiting a yes.
