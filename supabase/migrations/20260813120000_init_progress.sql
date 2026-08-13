-- dMAT Prep — initial schema.
--
-- Five tables, all user-owned, all behind row level security. The shape follows
-- one rule: a record of something that happened is immutable and append-only,
-- and anything mutable is a small document with an explicit last-writer.
--
--   attempts           append-only    one row per answered question
--   sessions           mutable        in-flight state, then a frozen result
--   question_exposure  counter        what has been shown, per context
--   user_state         document       milestones and self-added key dates
--   profiles           document       display name and avatar, nothing more
--
-- Aggregates (accuracy, readiness, hint rate) are never stored. They are derived
-- from attempts on read, exactly as they are in the local store, so the two can
-- never disagree.

-- ---------------------------------------------------------------------------
-- Enums, as check constraints rather than pg types: the app already owns these
-- vocabularies in TypeScript, and a check constraint is far cheaper to widen.
-- ---------------------------------------------------------------------------

-- section    figure-sequences | mathematical-equations | latin-squares
-- mode       practice | quick | diagnostic | timed | simulation
-- context    practice | diagnostic | mock
-- difficulty low | medium | high

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Display identity only. Nothing here is required to use dMAT Prep.';

-- ---------------------------------------------------------------------------
-- sessions
--
-- One row covers a session's whole life: it is written when the session starts,
-- updated as the candidate moves through it, and frozen when it completes. That
-- is what makes reload-resume possible without a second table — the row *is*
-- the restore point.
--
-- Timing is stored as absolute timestamps, never as a remaining-seconds counter.
-- A counter is meaningless after the browser has been closed for ten minutes;
-- `stage_ends_at` still tells the truth.
-- ---------------------------------------------------------------------------

create table if not exists public.sessions (
  -- Text rather than uuid: ids are minted on the client, and sessions created
  -- before this table existed carry a `mode-timestamp` id that must survive.
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  mode text not null check (mode in ('practice', 'quick', 'diagnostic', 'timed', 'simulation')),
  sections text[] not null default '{}',
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'expired', 'abandoned')),

  -- The exact questions this session was built from, in order, per stage. Held
  -- so a resumed session shows the same test rather than re-planning a new one.
  stages jsonb not null default '[]'::jsonb,

  -- Restore point.
  stage_index integer not null default 0,
  current_index integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  hints_used jsonb not null default '{}'::jsonb,
  phase text not null default 'running' check (phase in ('brief', 'running', 'break', 'done')),

  started_at timestamptz not null default now(),
  -- Null for the untimed diagnostic and for ordinary practice.
  stage_ends_at timestamptz,
  completed_at timestamptz,
  timed_out boolean not null default false,

  -- Frozen summary, written once on completion.
  duration_ms integer,
  total integer,
  answered integer,
  correct integer,

  updated_at timestamptz not null default now()
);

comment on column public.sessions.stage_ends_at is
  'Absolute deadline for the current stage. Remaining time is always recomputed from this, never from a client-side countdown.';

-- ---------------------------------------------------------------------------
-- attempts
--
-- Append-only. There is no update policy below, deliberately: an attempt is a
-- statement about something that already happened, and rewriting history would
-- silently change every derived figure in the product.
--
-- The primary key is minted on the client so a retried write is idempotent —
-- the same attempt sent twice collides on the key and is ignored rather than
-- doubling the candidate's question count.
-- ---------------------------------------------------------------------------

create table if not exists public.attempts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  question_id text not null,
  section text not null
    check (section in ('figure-sequences', 'mathematical-equations', 'latin-squares')),
  difficulty text not null check (difficulty in ('low', 'medium', 'high')),
  mode text not null check (mode in ('practice', 'quick', 'diagnostic', 'timed', 'simulation')),

  -- The option ids chosen, keyed the way the question asks: `{answer}` for a
  -- single-response item, `{image1, image2}` for a figure sequence.
  selection jsonb not null default '{}'::jsonb,
  is_correct boolean not null,
  hints_used smallint not null default 0 check (hints_used between 0 and 3),
  duration_ms integer,

  session_id text references public.sessions (id) on delete set null,

  -- When the candidate answered, per their device. `created_at` is when the row
  -- landed, which can be much later if it was queued offline.
  attempted_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- question_exposure
--
-- Which questions have been *shown*, tracked separately per context so the three
-- pools do not consume each other. Seeing an item in the diagnostic must not
-- disqualify it from a mock, which is the whole reason this is not one boolean.
--
-- `timed` and `simulation` both count as 'mock': a single-subtest mock and the
-- full simulation are the same kind of exposure, and a question met in one
-- should not reappear in the other.
-- ---------------------------------------------------------------------------

create table if not exists public.question_exposure (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id text not null,
  context text not null check (context in ('practice', 'diagnostic', 'mock')),
  section text not null
    check (section in ('figure-sequences', 'mathematical-equations', 'latin-squares')),

  times_seen integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),

  primary key (user_id, question_id, context)
);

-- ---------------------------------------------------------------------------
-- user_state
--
-- The two genuinely mutable pieces of progress: study-plan milestones, and the
-- dates a candidate adds themselves. Both are small documents that are replaced
-- wholesale, so they are last-write-wins on `updated_at` and live away from the
-- append-only tables where that rule would be wrong.
-- ---------------------------------------------------------------------------

create table if not exists public.user_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  milestones jsonb not null default '{}'::jsonb,
  key_dates jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes. Every user-owned table is read "everything for this user", and the
-- hot reads are the dashboard (recent attempts) and session restore.
-- ---------------------------------------------------------------------------

create index if not exists attempts_user_time_idx
  on public.attempts (user_id, attempted_at desc);
create index if not exists attempts_user_question_idx
  on public.attempts (user_id, question_id);
create index if not exists attempts_user_section_mode_idx
  on public.attempts (user_id, section, mode);
create index if not exists attempts_session_idx
  on public.attempts (session_id);

create index if not exists sessions_user_status_idx
  on public.sessions (user_id, status, started_at desc);

create index if not exists question_exposure_user_context_idx
  on public.question_exposure (user_id, context);

-- ---------------------------------------------------------------------------
-- Row level security.
--
-- Enabled on every table, with no policy that can ever match another user's
-- rows. `user_id` defaults to auth.uid() and the with-check clauses refuse any
-- insert claiming a different owner, so a client cannot write rows it does not
-- own even if it sends a forged user_id.
--
-- Policies are scoped `to authenticated`: the anonymous role has no access at
-- all, which is correct — guests keep their progress in their own browser and
-- never touch these tables.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.question_exposure enable row level security;
alter table public.user_state enable row level security;

-- profiles
drop policy if exists "profiles are self-readable" on public.profiles;
create policy "profiles are self-readable"
  on public.profiles for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles are self-writable" on public.profiles;
create policy "profiles are self-writable"
  on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "profiles are self-updatable" on public.profiles;
create policy "profiles are self-updatable"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- sessions: full CRUD, because a session is a live working document.
drop policy if exists "sessions are self-readable" on public.sessions;
create policy "sessions are self-readable"
  on public.sessions for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "sessions are self-insertable" on public.sessions;
create policy "sessions are self-insertable"
  on public.sessions for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "sessions are self-updatable" on public.sessions;
create policy "sessions are self-updatable"
  on public.sessions for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "sessions are self-deletable" on public.sessions;
create policy "sessions are self-deletable"
  on public.sessions for delete to authenticated using ((select auth.uid()) = user_id);

-- attempts: read, append, and delete-your-own-history. No update policy, so an
-- attempt cannot be rewritten after the fact by anyone, including its owner.
drop policy if exists "attempts are self-readable" on public.attempts;
create policy "attempts are self-readable"
  on public.attempts for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "attempts are self-insertable" on public.attempts;
create policy "attempts are self-insertable"
  on public.attempts for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "attempts are self-deletable" on public.attempts;
create policy "attempts are self-deletable"
  on public.attempts for delete to authenticated using ((select auth.uid()) = user_id);

-- question_exposure
drop policy if exists "exposure is self-readable" on public.question_exposure;
create policy "exposure is self-readable"
  on public.question_exposure for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "exposure is self-insertable" on public.question_exposure;
create policy "exposure is self-insertable"
  on public.question_exposure for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "exposure is self-updatable" on public.question_exposure;
create policy "exposure is self-updatable"
  on public.question_exposure for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "exposure is self-deletable" on public.question_exposure;
create policy "exposure is self-deletable"
  on public.question_exposure for delete to authenticated using ((select auth.uid()) = user_id);

-- user_state
drop policy if exists "state is self-readable" on public.user_state;
create policy "state is self-readable"
  on public.user_state for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "state is self-insertable" on public.user_state;
create policy "state is self-insertable"
  on public.user_state for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "state is self-updatable" on public.user_state;
create policy "state is self-updatable"
  on public.user_state for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- A profile row for every new user, created by the database rather than the
-- client — the client cannot be trusted to have run, and a signed-in user
-- without a profile row is a state nothing else in the app expects.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.email
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- `updated_at` maintained in the database, so a client with a wrong clock
-- cannot win a last-write-wins merge by claiming a future timestamp.
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sessions_touch_updated_at on public.sessions;
create trigger sessions_touch_updated_at
  before update on public.sessions
  for each row execute function public.touch_updated_at();

drop trigger if exists user_state_touch_updated_at on public.user_state;
create trigger user_state_touch_updated_at
  before update on public.user_state
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
