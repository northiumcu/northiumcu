-- Member access: paused status + flexible membership approval

ALTER TYPE public.member_status ADD VALUE IF NOT EXISTS 'paused';

CREATE OR REPLACE FUNCTION public.approve_membership_application(
  p_application_id UUID,
  p_admin_id UUID,
  p_account_type public.account_type DEFAULT 'checking',
  p_require_kyc BOOLEAN DEFAULT TRUE
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
  primary_account public.accounts;
  acct_num TEXT;
  types public.account_type[];
  t public.account_type;
  slug TEXT;
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

  IF app.status NOT IN ('draft', 'submitted', 'under_review') THEN
    RAISE EXCEPTION 'application not in reviewable status';
  END IF;

  IF p_require_kyc THEN
    SELECT * INTO kyc FROM public.kyc_verifications WHERE application_id = p_application_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'kyc submission required before approval';
    END IF;

    UPDATE public.kyc_verifications
    SET status = 'approved', reviewed_by = p_admin_id, reviewed_at = NOW(), updated_at = NOW()
    WHERE application_id = p_application_id;
  END IF;

  IF app.profile_id IS NULL THEN
    RAISE EXCEPTION 'application missing profile';
  END IF;

  types := COALESCE(
    app.requested_account_types,
    ARRAY[p_account_type]::public.account_type[]
  );
  IF array_length(types, 1) IS NULL THEN
    types := ARRAY['checking']::public.account_type[];
  END IF;

  FOREACH t IN ARRAY types LOOP
    acct_num := public.generate_account_number();
    slug := CASE t
      WHEN 'checking' THEN 'essential_checking'
      WHEN 'savings' THEN 'high_yield_savings'
      WHEN 'certificate' THEN 'share_certificate'
      WHEN 'youth' THEN 'youth_savings'
      WHEN 'business' THEN 'business_checking'
      WHEN 'retirement' THEN 'ira_savings'
      ELSE 'essential_checking'
    END;

    INSERT INTO public.accounts (
      member_id, account_number, type, status, opened_at, product_slug
    ) VALUES (
      app.profile_id, acct_num, t, 'active', NOW(), slug
    )
    RETURNING * INTO new_account;

    IF primary_account IS NULL THEN
      primary_account := new_account;
    END IF;
  END LOOP;

  UPDATE public.membership_applications
  SET status = 'approved', reviewed_by = p_admin_id, reviewed_at = NOW(), updated_at = NOW()
  WHERE id = p_application_id;

  UPDATE public.profiles
  SET member_status = 'active', member_number = primary_account.account_number, updated_at = NOW()
  WHERE id = app.profile_id;

  INSERT INTO public.application_status_history (
    application_id, from_status, to_status, actor_id
  ) VALUES (
    p_application_id, app.status, 'approved', p_admin_id
  );

  RETURN primary_account;
END;
$$;
