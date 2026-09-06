-- -----------------------------------------------------------------------------
-- Free 3-week VIP trial for new signups
--
-- Every brand-new profile automatically receives a full-featured premium
-- entitlement for 21 days from the moment their profile row is created.
-- After 21 days it naturally expires (existing isPremium logic already
-- checks status = 'active' AND expires_at > now()), so the account quietly
-- downgrades to the normal free tier with zero extra client-side logic.
--
-- This only fires once per user: it is driven by an AFTER INSERT trigger on
-- public.profiles (profile rows are created exactly once per account, even
-- though ensureUserProfile() uses an upsert — upserts that hit the existing
-- row are UPDATEs, not INSERTs, so they never re-fire this trigger and can
-- never re-grant or extend a trial).
-- -----------------------------------------------------------------------------

-- 1. Allow a 'trial' plan_id alongside the existing paid plans.
ALTER TABLE public.premium_entitlements DROP CONSTRAINT IF EXISTS premium_entitlements_plan_id_check;
ALTER TABLE public.premium_entitlements
  ADD CONSTRAINT premium_entitlements_plan_id_check
  CHECK (plan_id IN ('trial', 'weekly', 'monthly', 'semester'));

-- 2. Trigger function: grant a 21-day trial entitlement for a brand-new profile.
CREATE OR REPLACE FUNCTION public.grant_signup_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.premium_entitlements (
    id, user_id, plan_id, provider_reference, status, starts_at, expires_at, updated_at
  )
  VALUES (
    format('trial_%s', NEW.id),
    NEW.id,
    'trial',
    NULL,
    'active',
    timezone('utc'::text, now()),
    timezone('utc'::text, now()) + interval '21 days',
    timezone('utc'::text, now())
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_signup_trial() FROM public, anon, authenticated;

-- 3. Wire it up: fires once, right after a new profile row is first created.
DROP TRIGGER IF EXISTS grant_signup_trial_trigger ON public.profiles;
CREATE TRIGGER grant_signup_trial_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_signup_trial();
