-- Allow all users (including anon) to read delivery charge settings (public config)
CREATE POLICY "settings_select_delivery_public"
  ON settings FOR SELECT
  TO anon, authenticated
  USING (key = 'delivery_charges');

-- Allow all users (including anon) to read store settings (public config like delivery threshold)
CREATE POLICY "settings_select_store_public"
  ON settings FOR SELECT
  TO anon, authenticated
  USING (key = 'store');
