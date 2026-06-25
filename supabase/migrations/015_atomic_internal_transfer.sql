-- Atomic internal transfer posting (debit source + credit destination in one transaction).

CREATE OR REPLACE FUNCTION public.execute_internal_transfer(
  p_source_account_id UUID,
  p_destination_account_id UUID,
  p_amount NUMERIC,
  p_debit_description TEXT,
  p_credit_description TEXT,
  p_reference TEXT,
  p_transfer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_debit JSONB;
  v_credit JSONB;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero.';
  END IF;

  IF p_source_account_id = p_destination_account_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same account.';
  END IF;

  v_debit := public.post_account_transaction(
    p_source_account_id,
    p_amount,
    'debit',
    'transfer',
    p_debit_description,
    p_reference,
    p_transfer_id,
    NOW()
  );

  v_credit := public.post_account_transaction(
    p_destination_account_id,
    p_amount,
    'credit',
    'transfer',
    p_credit_description,
    p_reference || '-CR',
    p_transfer_id,
    NOW()
  );

  RETURN jsonb_build_object(
    'debit', v_debit,
    'credit', v_credit
  );
END;
$$;

REVOKE ALL ON FUNCTION public.execute_internal_transfer(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_internal_transfer(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, UUID) TO service_role;
