-- Add delivery_zone column to orders for zone-based reporting
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone text DEFAULT 'outside_dhaka';
