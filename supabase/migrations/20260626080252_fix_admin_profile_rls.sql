-- Drop the recursive admin policy
DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;

-- Create a security-definer function to check admin role without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Recreate admin select policy using the security-definer helper
CREATE POLICY "admin_select_all_profiles" ON profiles
  FOR SELECT TO authenticated
  USING (public.is_admin() OR auth.uid() = id);

-- Allow admin to update any profile (e.g., promote users)
DROP POLICY IF EXISTS "admin_update_any_profile" ON profiles;
CREATE POLICY "admin_update_any_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
