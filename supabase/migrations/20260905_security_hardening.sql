-- =============================================================================
-- Security hardening migration
-- Addresses 9 findings from the security review:
--   1. Fake matches via direct INSERT on public.matches
--   2. Verification selfies/IDs publicly readable via the user-media bucket
--   3. Banned users could still send messages
--   5. "Who Liked You" leaked full profile data to free/client-side code
--   6. public.profiles exposed sensitive columns to anon/authenticated via SELECT *
--   8. Premium credit race condition on concurrent webhook/verify calls
-- (Findings 4, 7, 9 are edge-function/application code fixes with no SQL component.)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Fake matches — matches may now ONLY be created via record_profile_like().
--    Direct client INSERT/UPDATE/DELETE is removed. New RPCs cover the two
--    legitimate client actions that used to rely on direct table writes:
--    updating the match preview text, and unmatching.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can create matches involving themselves" ON public.matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can delete their own matches" ON public.matches;

-- Guarantee at most one match row per unordered pair of users, and that a user
-- can never match with themselves.
CREATE UNIQUE INDEX IF NOT EXISTS matches_unique_pair_idx
  ON public.matches (LEAST(user_id_1, user_id_2), GREATEST(user_id_1, user_id_2));

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_no_self_match;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_no_self_match CHECK (user_id_1 <> user_id_2);

CREATE OR REPLACE FUNCTION public.update_match_last_message(p_match_id TEXT, p_text TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.matches
  SET last_message = left(p_text, 500),
      last_message_time = timezone('utc'::text, now())
  WHERE id = p_match_id
    AND (user_id_1 = v_user_id OR user_id_2 = v_user_id)
    AND expires_at > timezone('utc'::text, now());
END;
$$;

REVOKE ALL ON FUNCTION public.update_match_last_message(TEXT, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_match_last_message(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.unmatch_user(p_match_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  DELETE FROM public.matches
  WHERE id = p_match_id
    AND (user_id_1 = v_user_id OR user_id_2 = v_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.unmatch_user(TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unmatch_user(TEXT) TO authenticated;


-- -----------------------------------------------------------------------------
-- 2. Verification IDs/selfies are public — move them into a private bucket.
--    Only the uploader (folder-owner) or an admin may read these objects.
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-media', 'verification-media', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users can upload verification media" ON storage.objects;
CREATE POLICY "Users can upload verification media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view own verification media" ON storage.objects;
CREATE POLICY "Users can view own verification media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-media' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));

DROP POLICY IF EXISTS "Users can delete own verification media" ON storage.objects;
CREATE POLICY "Users can delete own verification media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'verification-media' AND auth.uid()::text = (storage.foldername(name))[1]);


-- -----------------------------------------------------------------------------
-- 3. Banned users can still message — INSERT policy now also checks that the
--    sender is not banned, in addition to the existing match-membership check.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can send messages in their matches" ON public.messages;
CREATE POLICY "Users can send messages in their matches" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid()::text = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
        AND (auth.uid()::text = m.user_id_1 OR auth.uid()::text = m.user_id_2)
        AND m.expires_at > timezone('utc'::text, now())
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()::text AND p.is_banned = true
    )
  );


-- -----------------------------------------------------------------------------
-- 5. "Who Liked You" data leak — profile_likes SELECT is now restricted to the
--    sender only (recipients can no longer directly query who liked them), and
--    a SECURITY DEFINER RPC returns only what the client is allowed to see:
--    real profile data for premium users, generic placeholders for everyone
--    else. This closes the "blur is CSS-only" hole because free users never
--    receive the real sender_id/name/photo over the wire.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can read likes involving themselves" ON public.profile_likes;
CREATE POLICY "Users can read their sent likes" ON public.profile_likes FOR SELECT TO authenticated
  USING (auth.uid()::text = sender_id);

CREATE OR REPLACE FUNCTION public.fetch_who_liked_me()
RETURNS TABLE(sender_id TEXT, sender_name TEXT, sender_photo TEXT, created_at TIMESTAMPTZ, is_premium BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::text;
  v_is_premium BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.premium_entitlements pe
    WHERE pe.user_id = v_user_id AND pe.status = 'active' AND pe.expires_at > timezone('utc'::text, now())
  ) INTO v_is_premium;

  RETURN QUERY
  SELECT
    CASE WHEN v_is_premium THEN pl.sender_id ELSE 'hidden' END,
    CASE WHEN v_is_premium THEN p.name ELSE 'Someone' END,
    CASE WHEN v_is_premium THEN COALESCE(p.photos[1], '') ELSE '' END,
    pl.created_at,
    v_is_premium
  FROM public.profile_likes pl
  JOIN public.profiles p ON p.id = pl.sender_id
  LEFT JOIN public.matches m
    ON (LEAST(pl.sender_id, v_user_id) = m.user_id_1 AND GREATEST(pl.sender_id, v_user_id) = m.user_id_2)
  WHERE pl.recipient_id = v_user_id AND m.id IS NULL AND p.is_banned = false
  ORDER BY pl.created_at DESC
  LIMIT 100;
END;
$$;

REVOKE ALL ON FUNCTION public.fetch_who_liked_me() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_who_liked_me() TO authenticated;


-- -----------------------------------------------------------------------------
-- 6. Profile data leaks — replace the blanket SELECT grant with an explicit
--    per-role column allow-list. anon (unauthenticated/public) loses access to
--    is_banned/instagram/snapchat entirely; authenticated keeps those since the
--    app currently needs them for moderation UI and profile detail views.
--    verification_status is kept in both grants (vs. the original finding
--    write-up) because src/services/supabaseService.ts's PUBLIC_PROFILE_SELECT
--    still selects it for every profile fetch — dropping it would break
--    fetchProfiles() for all users. See task feedback for details.
-- -----------------------------------------------------------------------------

REVOKE SELECT ON TABLE public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, name, age, username, gender, faculty, department, level, campus_location,
  bio, photos, interests, looking_for, mode, is_verified, verification_status,
  badges, boost_expires_at, is_online, last_active, created_at
) ON TABLE public.profiles TO anon;

GRANT SELECT (
  id, name, age, username, gender, faculty, department, level, campus_location,
  bio, photos, interests, looking_for, mode, is_verified, verification_status,
  badges, is_banned, boost_expires_at, instagram, snapchat, is_online,
  last_active, created_at
) ON TABLE public.profiles TO authenticated;


-- -----------------------------------------------------------------------------
-- 8. Premium credit race condition — grant entitlements through a single
--    SECURITY DEFINER RPC that locks the user's existing row (FOR UPDATE)
--    before computing the new expiry, so concurrent webhook + client-verify
--    calls for the same user can no longer stack/clobber each other. Also
--    de-duplicates by provider_reference so retried webhook deliveries are
--    inert.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.grant_premium_entitlement(
  p_user_id TEXT,
  p_plan_id TEXT,
  p_provider_reference TEXT,
  p_duration_ms BIGINT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_expires TIMESTAMPTZ;
  v_starts_at TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
  IF EXISTS (SELECT 1 FROM public.premium_entitlements WHERE provider_reference = p_provider_reference) THEN
    RETURN;
  END IF;

  SELECT pe.expires_at INTO v_current_expires
  FROM public.premium_entitlements pe
  WHERE pe.user_id = p_user_id
  FOR UPDATE;

  v_starts_at := CASE WHEN v_current_expires IS NOT NULL AND v_current_expires > v_now THEN v_current_expires ELSE v_now END;
  v_expires_at := v_starts_at + make_interval(secs => p_duration_ms / 1000.0);

  INSERT INTO public.premium_entitlements (id, user_id, plan_id, provider_reference, status, starts_at, expires_at, updated_at)
  VALUES (format('premium_%s', p_user_id), p_user_id, p_plan_id, p_provider_reference, 'active', v_starts_at, v_expires_at, v_now)
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    provider_reference = EXCLUDED.provider_reference,
    status = 'active',
    starts_at = EXCLUDED.starts_at,
    expires_at = EXCLUDED.expires_at,
    updated_at = EXCLUDED.updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_premium_entitlement(TEXT, TEXT, TEXT, BIGINT) FROM public, anon, authenticated;
-- Intentionally not granted to authenticated/anon: only called by the
-- paystack-webhook / paystack-verify edge functions using the service role key.
