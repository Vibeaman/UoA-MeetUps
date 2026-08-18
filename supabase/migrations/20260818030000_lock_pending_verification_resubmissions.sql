-- Allow historical approved/rejected requests while preventing multiple active reviews.
CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_one_pending_per_user_idx
  ON public.verification_requests (user_id)
  WHERE status = 'pending';

COMMENT ON INDEX public.verification_requests_one_pending_per_user_idx IS
  'Prevents a student from submitting another verification while one request is pending.';

