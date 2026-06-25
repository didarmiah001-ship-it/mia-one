-- ── Payments table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method            text NOT NULL CHECK (method = ANY (ARRAY['cash_on_delivery','bkash','nagad','bank_transfer','stripe','sslcommerz'])),
  status            text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','submitted','verified','failed','refunded','partially_refunded'])),
  amount            numeric NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'BDT',

  -- Manual payments (bKash / Nagad / Bank)
  transaction_id    text,
  sender_number     text,
  submitted_at      timestamptz,

  -- Gateway payments (Stripe / SSLCommerz)
  gateway_ref       text,        -- Stripe PaymentIntent ID / SSLCommerz tran_id
  gateway_session   text,        -- SSLCommerz sessionkey
  gateway_response  jsonb,       -- raw gateway payload

  -- Refund
  refund_amount     numeric DEFAULT 0,
  refund_reason     text,
  refunded_at       timestamptz,

  -- Admin
  verified_by       text,
  verified_at       timestamptz,
  notes             text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admins can view / update all payments
CREATE POLICY "admin_select_payments" ON payments FOR SELECT
  TO service_role USING (true);

CREATE POLICY "admin_update_payments" ON payments FOR UPDATE
  TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_payments_order_id  ON payments(order_id);
CREATE INDEX idx_payments_user_id   ON payments(user_id, created_at DESC);
CREATE INDEX idx_payments_gateway   ON payments(gateway_ref) WHERE gateway_ref IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_payments_updated_at();

-- ── Add payment_id foreign key to orders ──────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES payments(id);
