-- =============================================================================
-- Northium Credit Union — Auth, KYC, OTP, Extended Transfers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- New enumerations
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.id_document_type AS ENUM (
    'drivers_license', 'state_id', 'passport'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.otp_purpose AS ENUM (
    'signup', 'login', 'email_verify'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.kyc_status AS ENUM (
    'pending', 'under_review', 'approved', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.transfer_type ADD VALUE IF NOT EXISTS 'ach';
ALTER TYPE public.transfer_type ADD VALUE IF NOT EXISTS 'direct_deposit';
ALTER TYPE public.transfer_type ADD VALUE IF NOT EXISTS 'local_wire';
ALTER TYPE public.transfer_type ADD VALUE IF NOT EXISTS 'international_wire';
ALTER TYPE public.transfer_type ADD VALUE IF NOT EXISTS 'zelle';

-- ---------------------------------------------------------------------------
-- Profile auth fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS internal_auth_secret TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (LOWER(username));

-- ---------------------------------------------------------------------------
-- OTP challenges
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  purpose public.otp_purpose NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_otp_challenges_email_idx
  ON public.auth_otp_challenges (email, purpose, created_at DESC);

-- ---------------------------------------------------------------------------
-- Pending signups (pre-auth registration)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pending_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  pin_hash TEXT NOT NULL,
  internal_auth_secret TEXT NOT NULL,
  ssn_encrypted TEXT NOT NULL,
  ssn_last_four TEXT NOT NULL CHECK (ssn_last_four ~ '^\d{4}$'),
  id_document_type public.id_document_type NOT NULL,
  id_document_number_encrypted TEXT NOT NULL,
  id_document_last_four TEXT NOT NULL,
  eligibility_category TEXT,
  email_verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- KYC records (sensitive — service role writes; staff reads metadata)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.membership_applications(id) ON DELETE SET NULL,
  status public.kyc_status NOT NULL DEFAULT 'pending',
  ssn_last_four TEXT NOT NULL CHECK (ssn_last_four ~ '^\d{4}$'),
  id_document_type public.id_document_type NOT NULL,
  id_document_last_four TEXT NOT NULL,
  ssn_encrypted TEXT NOT NULL,
  id_document_number_encrypted TEXT NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS kyc_verifications_profile_idx
  ON public.kyc_verifications (profile_id);

-- ---------------------------------------------------------------------------
-- Extended transfer destination fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS beneficiary_name TEXT,
  ADD COLUMN IF NOT EXISTS beneficiary_bank TEXT,
  ADD COLUMN IF NOT EXISTS destination_routing_number TEXT,
  ADD COLUMN IF NOT EXISTS destination_account_last_four TEXT,
  ADD COLUMN IF NOT EXISTS zelle_contact TEXT,
  ADD COLUMN IF NOT EXISTS wire_swift TEXT,
  ADD COLUMN IF NOT EXISTS wire_iban TEXT,
  ADD COLUMN IF NOT EXISTS wire_country TEXT;

-- ---------------------------------------------------------------------------
-- Generate unique 12-digit account numbers (admin approval only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate TEXT;
BEGIN
  LOOP
    candidate := lpad((floor(random() * 1000000000000)::BIGINT)::TEXT, 12, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.accounts WHERE account_number = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_membership_application(
  p_application_id UUID,
  p_admin_id UUID,
  p_account_type public.account_type DEFAULT 'checking'
)
RETURNS public.accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app public.membership_applications;
  kyc public.kyc_verifications;
  new_account public.accounts;
  acct_num TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_admin_id
      AND staff_role IN (
        'administrator'::public.staff_role,
        'super_administrator'::public.staff_role,
        'operations_manager'::public.staff_role,
        'compliance_officer'::public.staff_role
      )
  ) THEN
    RAISE EXCEPTION 'admin approval required';
  END IF;

  SELECT * INTO app FROM public.membership_applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'application not found';
  END IF;

  IF app.status NOT IN ('submitted', 'under_review') THEN
    RAISE EXCEPTION 'application not in reviewable status';
  END IF;

  UPDATE public.kyc_verifications
  SET status = 'approved', reviewed_by = p_admin_id, reviewed_at = NOW(), updated_at = NOW()
  WHERE application_id = p_application_id;

  SELECT * INTO kyc FROM public.kyc_verifications WHERE application_id = p_application_id;
  IF NOT FOUND OR kyc.status <> 'approved' THEN
    RAISE EXCEPTION 'kyc approval failed';
  END IF;

  IF app.profile_id IS NULL THEN
    RAISE EXCEPTION 'application missing profile';
  END IF;

  acct_num := public.generate_account_number();

  INSERT INTO public.accounts (
    member_id, account_number, type, status, opened_at, product_slug
  ) VALUES (
    app.profile_id, acct_num, p_account_type, 'active', NOW(), 'essential_checking'
  )
  RETURNING * INTO new_account;

  UPDATE public.membership_applications
  SET status = 'approved', reviewed_by = p_admin_id, reviewed_at = NOW(), updated_at = NOW()
  WHERE id = p_application_id;

  UPDATE public.profiles
  SET member_status = 'active', member_number = acct_num, updated_at = NOW()
  WHERE id = app.profile_id;

  INSERT INTO public.application_status_history (
    application_id, from_status, to_status, actor_id
  ) VALUES (
    p_application_id, app.status, 'approved', p_admin_id
  );

  RETURN new_account;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- OTP: no direct client access (API uses service role)
REVOKE ALL ON public.auth_otp_challenges FROM authenticated;
REVOKE ALL ON public.pending_signups FROM authenticated;
REVOKE ALL ON public.kyc_verifications FROM authenticated;

GRANT ALL ON public.auth_otp_challenges TO service_role;
GRANT ALL ON public.pending_signups TO service_role;
GRANT ALL ON public.kyc_verifications TO service_role;

-- Staff can read KYC metadata (not encrypted columns via view policy — staff read limited fields in app)
CREATE POLICY kyc_staff_read ON public.kyc_verifications
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY kyc_staff_update ON public.kyc_verifications
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Members see own KYC status only (no encrypted fields exposed in API layer)
GRANT SELECT, UPDATE ON public.kyc_verifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_membership_application(UUID, UUID, public.account_type) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_account_number() TO service_role;

CREATE POLICY kyc_member_read_own ON public.kyc_verifications
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());
