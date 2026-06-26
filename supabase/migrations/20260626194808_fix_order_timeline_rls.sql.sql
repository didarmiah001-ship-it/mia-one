-- Fix RLS policy for order_timeline to allow inserts for both authenticated and guest orders

-- Drop existing policies
DROP POLICY IF EXISTS "owner_select_timeline" ON order_timeline;
DROP POLICY IF EXISTS "admin_all_timeline" ON order_timeline;

-- SELECT: Users can view timeline for orders they own (user_id matches) or guest orders (user_id is null)
CREATE POLICY "select_own_timeline" ON order_timeline FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_timeline.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- INSERT: Allow inserts if the associated order belongs to the user OR is a guest order
CREATE POLICY "insert_timeline" ON order_timeline FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_timeline.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Admin policies: Admins can do everything
CREATE POLICY "admin_select_timeline" ON order_timeline FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_insert_timeline" ON order_timeline FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_update_timeline" ON order_timeline FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );