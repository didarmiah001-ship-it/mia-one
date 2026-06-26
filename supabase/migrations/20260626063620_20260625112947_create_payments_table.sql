CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method = ANY (ARRAY['cash_on_delivery','bkash','nagad','bank_transfer','stripe','sslcommerz'])),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','submitted','verified','failed','refunded','partially_refunded'])),
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',
  transaction_id TEXT,
  sender_number TEXT,
  submitted_at TIMESTAMPTZ,
  gateway_ref TEXT,
  gateway_session TEXT,
  gateway_response JSONB,
  refund_amount NUMERIC DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payments;
DROP POLICY IF EXISTS "insert_own_payments" ON payments;
DROP POLICY IF EXISTS "update_own_payments" ON payments;
DROP POLICY IF EXISTS "admin_select_payments" ON payments;
DROP POLICY IF EXISTS "admin_update_payments" ON payments;

CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_select_payments" ON payments FOR SELECT
  TO service_role USING (true);
CREATE POLICY "admin_update_payments" ON payments FOR UPDATE
  TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(gateway_ref) WHERE gateway_ref IS NOT NULL;

CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_payments_updated_at();

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);