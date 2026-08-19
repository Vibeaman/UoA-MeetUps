-- Tighten direct RPC permissions for trigger-only helpers and protect gossip view records.

-- These functions are invoked by table triggers and must not be callable through the REST API.
REVOKE EXECUTE ON FUNCTION public.guard_profile_protected_fields() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_gossip_post() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_verification_request() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_match() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_message() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_profile_like() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_story_like() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_verification() FROM public, anon, authenticated;

-- Comment reads remain available to signed-out and signed-in viewers, but the function is invoker-owned.
ALTER FUNCTION public.fetch_gossip_comments(TEXT) SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.fetch_gossip_comments(TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_gossip_comments(TEXT) TO anon, authenticated;

-- View rows are written and read only by security-definer RPCs. Keep a policy in place so
-- accidental direct client access remains denied while RLS has an explicit policy.
DROP POLICY IF EXISTS "No direct client access to gossip_post_views" ON public.gossip_post_views;
CREATE POLICY "No direct client access to gossip_post_views"
  ON public.gossip_post_views
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

NOTIFY pgrst, 'reload schema';

-- Verification notes:
-- * record_gossip_view() remains authenticated-only and security-definer.
-- * Trigger execution is unaffected because PostgreSQL triggers do not require
--   the invoking client role to have EXECUTE on the trigger function.
-- * The service role continues to bypass RLS for trusted administrative reads.

COMMIT;
