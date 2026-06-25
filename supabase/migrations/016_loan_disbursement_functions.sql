-- Loan disbursement accounts: approved loans fund a spendable loan account.

ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS disbursement_account_id UUID REFERENCES public.accounts(id);

CREATE INDEX IF NOT EXISTS idx_loans_disbursement_account
  ON public.loans (disbursement_account_id)
  WHERE disbursement_account_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.disburse_loan(p_loan_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan public.loans;
  v_principal NUMERIC(15, 2);
  v_account_id UUID;
  v_acct_num TEXT;
  v_product TEXT;
BEGIN
  SELECT * INTO v_loan
  FROM public.loans
  WHERE id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found.';
  END IF;

  IF v_loan.disbursement_account_id IS NOT NULL THEN
    RETURN v_loan.disbursement_account_id;
  END IF;

  IF v_loan.status NOT IN ('approved', 'funded', 'active') THEN
    RAISE EXCEPTION 'Loan must be approved before disbursement.';
  END IF;

  v_principal := ROUND(COALESCE(v_loan.principal_amount, v_loan.requested_amount, 0)::numeric, 2);

  IF v_principal IS NULL OR v_principal <= 0 THEN
    RAISE EXCEPTION 'Loan principal must be greater than zero.';
  END IF;

  v_acct_num := public.generate_account_number();
  v_product := v_loan.loan_type::TEXT || '_loan';

  INSERT INTO public.accounts (
    member_id,
    account_number,
    type,
    balance,
    available_balance,
    status,
    opened_at,
    product_slug
  )
  VALUES (
    v_loan.member_id,
    v_acct_num,
    'loan',
    0,
    0,
    'active',
    NOW(),
    v_product
  )
  RETURNING id INTO v_account_id;

  PERFORM public.post_account_transaction(
    v_account_id,
    v_principal,
    'credit',
    'deposit',
    'Loan Disbursement — ' || INITCAP(REPLACE(v_loan.loan_type::TEXT, '_', ' ')),
    'LOAN-' || LEFT(REPLACE(p_loan_id::TEXT, '-', ''), 12),
    NULL,
    NOW()
  );

  UPDATE public.loans
  SET
    disbursement_account_id = v_account_id,
    principal_amount = v_principal,
    outstanding_balance = v_principal,
    status = 'active',
    funded_at = COALESCE(funded_at, NOW()),
    updated_at = NOW()
  WHERE id = p_loan_id;

  RETURN v_account_id;
END;
$$;

REVOKE ALL ON FUNCTION public.disburse_loan(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.disburse_loan(UUID) TO service_role;

-- Backfill already-approved loans that never received a disbursement account.
DO $$
DECLARE
  loan_row RECORD;
BEGIN
  FOR loan_row IN
    SELECT id
    FROM public.loans
    WHERE disbursement_account_id IS NULL
      AND status IN ('approved', 'funded', 'active')
      AND COALESCE(principal_amount, requested_amount, 0) > 0
  LOOP
    PERFORM public.disburse_loan(loan_row.id);
  END LOOP;
END;
$$;
