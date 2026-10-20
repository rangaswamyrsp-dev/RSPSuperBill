-- ==============================================================================
-- RSP SuperBill — Shop Provisioning, Authentication & Application Separation Migration
-- Migration: 20261020_superbill_shop_auth.sql
-- Description:
--   1. Ensures pgcrypto extension is available for secure bcrypt password hashing.
--   2. Adds `password_hash` and `app_access` columns to `public.tenants` (non-destructive).
--   3. Safely populates `password_hash` for existing tenants using bcrypt.
--   4. Creates `public.superbill_auth_login` function for secure server-side auth
--      with strict RSP SuperBill application entitlement checks.
--   5. Creates `public.superbill_provision_shop` function for Super Admin shop creation
--      without storing plaintext passwords in application tables.
--   6. Grants execute privileges to `anon` and `authenticated`.
-- ==============================================================================

-- Step 1: Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Step 2: Add non-destructive security columns to public.tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS app_access text[] DEFAULT ARRAY['superbill'];

-- Step 3: Populate password_hash from existing admin_password where password_hash is not set
UPDATE public.tenants
SET password_hash = extensions.crypt(admin_password, extensions.gen_salt('bf'))
WHERE (password_hash IS NULL OR password_hash = '')
  AND admin_password IS NOT NULL
  AND admin_password <> '';

-- Step 4: Tag existing Hotel tenant(s) with SuperBill application entitlement
UPDATE public.tenants
SET app_access = ARRAY['superbill'],
    features = COALESCE(features, '{}'::jsonb) || '{"superbill": true, "apps": ["superbill"]}'::jsonb
WHERE type IN ('Hotel', 'Restaurant', 'Supermarket', 'Kirana Store', 'General Store', 'Electronics Shop', 'Mobile Shop')
   OR id = 'T392320';

-- Step 5: Secure Authentication RPC Function
CREATE OR REPLACE FUNCTION public.superbill_auth_login(
  p_login text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_tenant record;
  v_clean_login text;
  v_is_authorized boolean := false;
  v_password_valid boolean := false;
BEGIN
  v_clean_login := trim(p_login);

  IF v_clean_login = '' OR p_password = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_INPUT',
      'message', 'User ID / Phone and password are required.'
    );
  END IF;

  -- Search for tenant by admin_phone, id, or business_email
  SELECT *
  INTO v_tenant
  FROM public.tenants
  WHERE admin_phone = v_clean_login
     OR id = v_clean_login
     OR lower(business_email) = lower(v_clean_login)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'NOT_FOUND',
      'message', 'Invalid phone (User ID) or password.'
    );
  END IF;

  -- Check if account is active
  IF v_tenant.active IS FALSE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ACCOUNT_SUSPENDED',
      'message', 'This business account is suspended. Please contact Super Admin.'
    );
  END IF;

  -- Verify password using bcrypt hash
  IF v_tenant.password_hash IS NOT NULL AND v_tenant.password_hash <> '' THEN
    v_password_valid := (v_tenant.password_hash = extensions.crypt(p_password, v_tenant.password_hash));
  ELSE
    -- Backward-compatible fallback for unmigrated record
    v_password_valid := (v_tenant.admin_password = p_password);
    -- Upgrade to hash immediately
    IF v_password_valid THEN
      UPDATE public.tenants
      SET password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
      WHERE id = v_tenant.id;
    END IF;
  END IF;

  IF NOT v_password_valid THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_PASSWORD',
      'message', 'Invalid phone (User ID) or password.'
    );
  END IF;

  -- CRITICAL REQUIREMENT: RSP SuperBill vs RSP Medical Billing Separation
  -- Check if this tenant is explicitly authorized for RSP SuperBill
  v_is_authorized := (
    (v_tenant.features->>'superbill' = 'true') OR
    ('superbill' = ANY(v_tenant.app_access)) OR
    (v_tenant.type IS NOT NULL AND lower(v_tenant.type) NOT IN ('medical', 'medical store'))
  );

  IF NOT v_is_authorized THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'UNAUTHORIZED_MEDICAL',
      'message', 'Unauthorized: This account is registered for RSP Medical Billing only and is not provisioned for RSP SuperBill. Please contact RSP Super Admin.'
    );
  END IF;

  -- Return sanitized profile (never exposing password or hash)
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_tenant.id,
      'phone', COALESCE(v_tenant.admin_phone, v_tenant.id),
      'name', COALESCE(v_tenant.admin_name, v_tenant.name),
      'role', 'Admin',
      'store', v_tenant.name,
      'hotelId', v_tenant.id,
      'businessType', v_tenant.type,
      'city', v_tenant.city,
      'state', v_tenant.state,
      'features', v_tenant.features,
      'isMainAdmin', true
    )
  );
END;
$$;

-- Step 6: Secure Shop Provisioning RPC Function (Super Admin)
CREATE OR REPLACE FUNCTION public.superbill_provision_shop(
  p_tenant_id text,
  p_name text,
  p_type text,
  p_owner_name text,
  p_phone text,
  p_password text,
  p_features jsonb DEFAULT '{}'::jsonb,
  p_city text DEFAULT NULL,
  p_state text DEFAULT 'Andhra Pradesh',
  p_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id text;
  v_hash text;
  v_features jsonb;
  v_new_record record;
BEGIN
  v_id := COALESCE(NULLIF(trim(p_tenant_id), ''), 'T' || floor(100000 + random() * 900000)::text);
  v_hash := extensions.crypt(p_password, extensions.gen_salt('bf'));
  v_features := COALESCE(p_features, '{}'::jsonb) || '{"superbill": true, "apps": ["superbill"]}'::jsonb;

  -- Check if login phone is already taken by another active tenant
  IF EXISTS (SELECT 1 FROM public.tenants WHERE admin_phone = trim(p_phone) AND id <> v_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'PHONE_EXISTS',
      'message', 'A business account with this User ID / Phone already exists.'
    );
  END IF;

  INSERT INTO public.tenants (
    id,
    name,
    type,
    admin_name,
    admin_phone,
    admin_password, -- retained temporarily for medical compatibility if needed
    password_hash,
    app_access,
    features,
    city,
    state,
    business_email,
    active,
    created_at,
    updated_at
  ) VALUES (
    v_id,
    trim(p_name),
    trim(p_type),
    trim(p_owner_name),
    trim(p_phone),
    p_password,
    v_hash,
    ARRAY['superbill'],
    v_features,
    p_city,
    p_state,
    p_email,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    admin_name = EXCLUDED.admin_name,
    admin_phone = EXCLUDED.admin_phone,
    admin_password = EXCLUDED.admin_password,
    password_hash = EXCLUDED.password_hash,
    features = EXCLUDED.features,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    business_email = EXCLUDED.business_email,
    updated_at = now()
  RETURNING * INTO v_new_record;

  RETURN jsonb_build_object(
    'success', true,
    'tenant', jsonb_build_object(
      'id', v_new_record.id,
      'name', v_new_record.name,
      'type', v_new_record.type,
      'ownerName', v_new_record.admin_name,
      'phone', v_new_record.admin_phone,
      'loginId', v_new_record.admin_phone,
      'city', v_new_record.city,
      'state', v_new_record.state,
      'active', v_new_record.active,
      'features', v_new_record.features,
      'createdAt', v_new_record.created_at
    )
  );
END;
$$;

-- Step 7: Grant Execution Privileges to Client Roles
GRANT EXECUTE ON FUNCTION public.superbill_auth_login(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.superbill_provision_shop(text, text, text, text, text, text, jsonb, text, text, text) TO anon, authenticated;

-- ==============================================================================
-- VALIDATION QUERIES (Run these in Supabase SQL Editor to verify installation):
-- 1. Check functions exist:
--    SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE 'superbill_%';
-- 2. Test SuperBill Login with existing hotel shop:
--    SELECT public.superbill_auth_login('8885848601', 'RSP123');
-- 3. Test Medical Shop Rejection (should return UNAUTHORIZED_MEDICAL):
--    SELECT public.superbill_auth_login('9182862010', 'Anam@2026');
-- ==============================================================================
