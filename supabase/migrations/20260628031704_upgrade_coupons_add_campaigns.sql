-- ════════════════════════════════════════════════════════════════════════════
-- Upgrade coupons table with full campaign management fields
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount numeric DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS starts_at timestamptz DEFAULT now();
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_limit_per_customer int DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applicable_scope text DEFAULT 'all';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applicable_product_ids uuid[] DEFAULT '{}';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applicable_category_ids uuid[] DEFAULT '{}';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS free_delivery boolean DEFAULT false;

-- Add coupon tracking columns to orders for order protection
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_discount numeric DEFAULT 0;

-- Track per-customer coupon usage
CREATE TABLE IF NOT EXISTS coupon_usage (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  coupon_code text NOT NULL,
  user_id     uuid,
  order_id    uuid,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupon_usage_select_admin" ON coupon_usage FOR SELECT
  TO authenticated USING (
    (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
    OR user_id = auth.uid()
  );
CREATE POLICY "coupon_usage_insert_auth" ON coupon_usage FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "coupon_usage_delete_admin" ON coupon_usage FOR DELETE
  TO authenticated USING (
    (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- Campaigns table (marketing campaigns shown on customer homepage)
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaigns (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  banner_url           text,
  banner_mobile_url    text,
  start_date           timestamptz DEFAULT now(),
  end_date             timestamptz,
  discount_type        text DEFAULT 'percentage',
  discount_value       numeric DEFAULT 0,
  applicable_scope     text DEFAULT 'all',
  applicable_product_ids   uuid[] DEFAULT '{}',
  applicable_category_ids  uuid[] DEFAULT '{}',
  coupon_code          text,
  is_active            boolean DEFAULT true,
  sort_order           int DEFAULT 0,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_select_public" ON campaigns FOR SELECT
  TO anon, authenticated USING (is_active = true);
CREATE POLICY "campaigns_select_admin" ON campaigns FOR SELECT
  TO authenticated USING (
    (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );
CREATE POLICY "campaigns_insert_admin" ON campaigns FOR INSERT
  TO authenticated WITH CHECK (
    (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );
CREATE POLICY "campaigns_update_admin" ON campaigns FOR UPDATE
  TO authenticated USING (
    (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );
CREATE POLICY "campaigns_delete_admin" ON campaigns FOR DELETE
  TO authenticated USING (
    (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
  );

-- Allow public read of coupons (for coupon validation at checkout)
CREATE POLICY "coupons_select_public" ON coupons FOR SELECT
  TO anon, authenticated USING (is_active = true);
