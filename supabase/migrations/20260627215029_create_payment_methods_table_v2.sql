-- Payment Methods Table - Dynamic payment configuration
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('bkash', 'nagad', 'rocket', 'bank_transfer', 'cash_on_delivery', 'stripe', 'sslcommerz')),
  account_name TEXT NOT NULL DEFAULT '',
  account_number TEXT NOT NULL DEFAULT '',
  account_type TEXT NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal', 'agent', 'merchant', 'bank', 'none')),
  bank_name TEXT DEFAULT '',
  branch_name TEXT DEFAULT '',
  routing_number TEXT DEFAULT '',
  payment_instructions TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  icon_url TEXT DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read for active methods, admin full access
CREATE POLICY "payment_methods_public_read" ON payment_methods
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "payment_methods_admin_all" ON payment_methods
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Add payment confirmation fields to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT DEFAULT '';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_note TEXT DEFAULT '';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);

-- Add payment screenshot and note columns to orders for guest orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_payment_note TEXT DEFAULT '';

-- Insert default payment methods
INSERT INTO payment_methods (payment_type, account_name, account_number, account_type, display_name, payment_instructions, is_active, sort_order) VALUES
('bkash', 'MIA ONE', '01823057578', 'merchant', 'বিকাশ', 'বিকাশ অ্যাপ খুলুন → সেন্ড মানি → মার্চেন্ট নম্বর লিখুন → সঠিক পরিমাণ লিখুন → আপনার অর্ডার নম্বর রেফারেন্স হিসেবে ব্যবহার করুন।', true, 1),
('nagad', 'MIA ONE', '01823057578', 'merchant', 'নগদ', 'নগদ অ্যাপ খুলুন → সেন্ড মানি → মার্চেন্ট নম্বর লিখুন → সঠিক পরিমাণ লিখুন → আপনার অর্ডার নম্বর রেফারেন্স হিসেবে ব্যবহার করুন।', true, 2),
('cash_on_delivery', '', '', 'none', 'ক্যাশ অন ডেলিভারি', 'পণ্য পেয়ে টাকা দিন। ডেলিভারি চার্জ সহ পূর্ণ টাকা প্রস্তুত রাখুন।', true, 99);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_updated_at();