-- Create a secure function to check if an email exists
-- This function uses SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM accounts 
        WHERE LOWER(email) = LOWER(email_to_check)
    );
END;
$$;

-- Grant execute permission to anonymous users (for password reset)
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;
