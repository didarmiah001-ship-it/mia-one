-- Fix guest checkout by making user_id nullable and adding RLS policy for guest orders

-- First, drop the foreign key constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Make user_id nullable to allow guest orders
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Check constraint on status - ensure valid values
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('placed', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'));

-- Drop existing RLS policies
DROP POLICY IF EXISTS "select_own_orders" ON orders;
DROP POLICY IF EXISTS "insert_own_orders" ON orders;
DROP POLICY IF EXISTS "update_own_orders" ON orders;
DROP POLICY IF EXISTS "admin_select_all_orders" ON orders;
DROP POLICY IF EXISTS "admin_update_all_orders" ON orders;

-- Create new RLS policies that handle both authenticated and guest orders
-- For authenticated users - they can see/manage their own orders
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "update_own_orders" ON orders FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admin policies
CREATE POLICY "admin_select_all_orders" ON orders FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_update_all_orders" ON orders FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix payments table similarly
-- Drop foreign key constraint to allow guest payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

-- Make user_id nullable
ALTER TABLE payments ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies for payments
DROP POLICY IF EXISTS "select_own_payments" ON payments;
DROP POLICY IF EXISTS "insert_own_payments" ON payments;
DROP POLICY IF EXISTS "update_own_payments" ON payments;

CREATE POLICY "select_own_payments" ON payments FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);