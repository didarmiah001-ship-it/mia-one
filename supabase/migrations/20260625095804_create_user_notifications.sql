
-- User notifications inbox (broadcast notifications delivered to each user)
CREATE TABLE IF NOT EXISTS user_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  message     text NOT NULL,
  type        text NOT NULL DEFAULT 'info' CHECK (type = ANY (ARRAY['info', 'promo', 'alert', 'order'])),
  is_read     boolean NOT NULL DEFAULT false,
  link        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_notifications" ON user_notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_notifications" ON user_notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_notifications" ON user_notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_notifications" ON user_notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Service role can insert notifications for any user (admin broadcasts)
CREATE POLICY "service_insert_notifications" ON user_notifications FOR INSERT
  TO service_role WITH CHECK (true);

CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id, created_at DESC);
