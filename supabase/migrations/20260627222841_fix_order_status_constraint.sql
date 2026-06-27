-- Fix order status constraint to include all statuses used in admin panel
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY[
    'placed'::text,
    'pending'::text,
    'received'::text,
    'confirmed'::text,
    'processing'::text,
    'packed'::text,
    'ready_for_delivery'::text,
    'shipped'::text,
    'out_for_delivery'::text,
    'delivered'::text,
    'cancelled'::text,
    'refunded'::text
  ]));