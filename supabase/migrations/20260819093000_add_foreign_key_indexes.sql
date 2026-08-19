-- Add covering indexes for foreign-key columns reported by the Supabase performance advisor.
CREATE INDEX IF NOT EXISTS app_notifications_actor_id_idx
  ON public.app_notifications (actor_id);

CREATE INDEX IF NOT EXISTS campus_stories_user_id_idx
  ON public.campus_stories (user_id);

CREATE INDEX IF NOT EXISTS campus_story_likes_user_id_idx
  ON public.campus_story_likes (user_id);

CREATE INDEX IF NOT EXISTS chat_security_events_actor_id_idx
  ON public.chat_security_events (actor_id);

CREATE INDEX IF NOT EXISTS chat_security_events_message_id_idx
  ON public.chat_security_events (message_id);

CREATE INDEX IF NOT EXISTS gossip_comment_likes_user_id_idx
  ON public.gossip_comment_likes (user_id);

CREATE INDEX IF NOT EXISTS gossip_comments_post_id_idx
  ON public.gossip_comments (post_id);

CREATE INDEX IF NOT EXISTS gossip_post_views_user_id_idx
  ON public.gossip_post_views (user_id);

CREATE INDEX IF NOT EXISTS gossip_reports_reporter_id_idx
  ON public.gossip_reports (reporter_id);

CREATE INDEX IF NOT EXISTS matches_user_id_1_idx
  ON public.matches (user_id_1);

CREATE INDEX IF NOT EXISTS matches_user_id_2_idx
  ON public.matches (user_id_2);

CREATE INDEX IF NOT EXISTS messages_match_id_idx
  ON public.messages (match_id);

CREATE INDEX IF NOT EXISTS messages_sender_id_idx
  ON public.messages (sender_id);

CREATE INDEX IF NOT EXISTS payment_transactions_user_id_idx
  ON public.payment_transactions (user_id);

CREATE INDEX IF NOT EXISTS user_reports_target_user_id_idx
  ON public.user_reports (target_user_id);
