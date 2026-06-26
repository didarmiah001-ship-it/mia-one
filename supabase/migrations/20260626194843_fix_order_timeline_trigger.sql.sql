-- Fix the log_order_status_change trigger to bypass RLS by using SECURITY DEFINER
-- This allows the trigger to insert into order_timeline regardless of caller permissions

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO order_timeline(order_id, status, created_by)
    VALUES (NEW.id, NEW.status, 'system');
  END IF;
  RETURN NEW;
END;
$function$;

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION log_order_status_change() TO authenticated;
GRANT EXECUTE ON FUNCTION log_order_status_change() TO anon;