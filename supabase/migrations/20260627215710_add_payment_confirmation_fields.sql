-- Add payment confirmation fields to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_note TEXT;

-- Add payment confirmation fields to orders table (for admin reference)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_payment_note TEXT;

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow public reads
CREATE POLICY "payment_proofs_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'payment-proofs');

-- Storage policy: Allow authenticated users to upload
CREATE POLICY "payment_proofs_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs');

-- Storage policy: Allow users to delete their own uploads (via service role in edge functions)
CREATE POLICY "payment_proofs_service_delete" ON storage.objects
  FOR DELETE TO service_role
  USING (bucket_id = 'payment-proofs');