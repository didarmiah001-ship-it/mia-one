CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  channel TEXT NOT NULL DEFAULT 'in_app',
  target TEXT NOT NULL DEFAULT 'all',
  link TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  recipient_count INT DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_campaigns" ON notification_campaigns;
DROP POLICY IF EXISTS "admin_insert_campaigns" ON notification_campaigns;
DROP POLICY IF EXISTS "admin_update_campaigns" ON notification_campaigns;
DROP POLICY IF EXISTS "admin_delete_campaigns" ON notification_campaigns;

CREATE POLICY "admin_select_campaigns" ON notification_campaigns
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_campaigns" ON notification_campaigns
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_campaigns" ON notification_campaigns
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_campaigns" ON notification_campaigns
  FOR DELETE TO authenticated USING (true);

ALTER TABLE user_notifications
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

ALTER TABLE user_notifications
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES notification_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_notif_user_category
  ON user_notifications (user_id, category, created_at DESC);