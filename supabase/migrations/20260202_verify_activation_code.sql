-- RPC function to verify activation code and return auth credentials
-- Uses bcrypt comparison via crypt() function

CREATE OR REPLACE FUNCTION verify_activation_code(
    p_email TEXT,
    p_code TEXT
)
RETURNS TABLE (
    valid BOOLEAN,
    account_id UUID,
    auth_user_id UUID,
    account_status TEXT,
    portal_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_account_id UUID;
    v_auth_user_id UUID;
    v_code_hash TEXT;
    v_expires_at TIMESTAMPTZ;
    v_account_status TEXT;
    v_portal_role TEXT;
BEGIN
    -- Get account info
    SELECT a.id, a.auth_user_id, a.account_status, a.portal_role
    INTO v_account_id, v_auth_user_id, v_account_status, v_portal_role
    FROM accounts a
    WHERE LOWER(a.email) = LOWER(p_email);
    
    IF v_account_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Get activation code
    SELECT code_hash, expires_at
    INTO v_code_hash, v_expires_at
    FROM account_activation_codes
    WHERE account_id = v_account_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_code_hash IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Check if expired
    IF v_expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Verify code using bcrypt
    IF v_code_hash = crypt(p_code, v_code_hash) THEN
        -- Delete used code
        DELETE FROM account_activation_codes WHERE account_id = v_account_id;
        
        RETURN QUERY SELECT TRUE, v_account_id, v_auth_user_id, v_account_status, v_portal_role;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT;
    END IF;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION verify_activation_code(TEXT, TEXT) TO authenticated, anon;
