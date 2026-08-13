-- Take the trigger functions out of the exposed API surface.
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default, which means
-- `public.handle_new_user()` — a SECURITY DEFINER function that writes to
-- `public.profiles` — was grantable to every client role, and Supabase's
-- security advisor flags it at `/rest/v1/rpc/handle_new_user`.
--
-- In practice it was never callable: both functions return `trigger`, and
-- PostgREST refuses to expose trigger functions (an RPC call returns
-- PGRST202, verified against this project before writing this). So this is
-- defence in depth rather than a fix for a live hole — but the surface should
-- not depend on a downstream tool's willingness to decline.
--
-- Revoking EXECUTE does not stop the triggers firing. Postgres checks EXECUTE
-- on a trigger function when the trigger is *created*, not each time it runs,
-- and both of these run as their owner. `on_auth_user_created` continues to be
-- fired by `supabase_auth_admin` on signup exactly as before; the migration
-- that follows this one in the test plan proves it by inserting a user and
-- watching a profile row appear.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
