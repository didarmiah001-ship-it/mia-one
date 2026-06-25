-- Notification campaigns: track every broadcast/push/email the admin sends
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  message         text NOT NULL,
  type            text NOT NULL DEFAULT 'info',   -- info | promo | alert | order | flash_sale | coupon
  channel         text NOT NULL DEFAULT 'in_app', -- in_app | push | email | all
  target          text NOT NULL DEFAULT 'all',    -- all | segment_tag
  link            text,                           -- optional deep link
  image_url       text,
  status          text NOT NULL DEFAULT 'draft',  -- draft | sent | failed
  recipient_count int  DEFAULT 0,
  sent_at         timestamptz,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_campaigns" ON notification_campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_insert_campaigns" ON notification_campaigns
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_campaigns" ON notification_campaigns
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_campaigns" ON notification_campaigns
  FOR DELETE TO authenticated USING (true);

-- Add category column to user_notifications if not present
ALTER TABLE user_notifications
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general'; -- general | offers | orders | flash_sale | coupons

-- Add campaign_id FK to user_notifications
ALTER TABLE user_notifications
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES notification_campaigns(id) ON DELETE SET NULL;

-- Index for fast per-user inbox with category filter
CREATE INDEX IF NOT EXISTS idx_user_notif_user_category
  ON user_notifications (user_id, category, created_at DESC);
