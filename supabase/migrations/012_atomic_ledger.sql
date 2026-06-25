-- Atomic account ledger posting with row-level lock (FOR UPDATE).

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS ledger_direction TEXT
  CHECK (ledger_direction IN ('credit', 'debit'));

CREATE INDEX IF NOT EXISTS idx_transactions_account_posted_at
  ON public.transactions (account_id, posted_at DESC);

CREATE OR REPLACE FUNCTION public.post_account_transaction(
  p_account_id UUID,
  p_amount NUMERIC,
  p_direction TEXT,
  p_type public.transaction_type,
  p_description TEXT,
  p_reference TEXT DEFAULT NULL,
  p_transfer_id UUID DEFAULT NULL,
  p_posted_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account public.accounts;
  v_delta NUMERIC;
  v_next_balance NUMERIC;
  v_next_available NUMERIC;
  v_tx public.transactions;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero.';
  END IF;

  IF p_direction NOT IN ('credit', 'debit') THEN
    RAISE EXCEPTION 'Invalid ledger direction.';
  END IF;

  SELECT * INTO v_account
  FROM public.accounts
  WHERE id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found.';
  END IF;

  IF v_account.status <> 'active' THEN
    RAISE EXCEPTION 'Account is not active.';
  END IF;

  v_delta := CASE WHEN p_direction = 'credit' THEN p_amount ELSE -p_amount END;
  v_next_balance := ROUND((v_account.balance + v_delta)::numeric, 2);
  v_next_available := ROUND((v_account.available_balance + v_delta)::numeric, 2);

  IF v_next_balance < 0 OR v_next_available < 0 THEN
    RAISE EXCEPTION 'Insufficient balance for this debit.';
  END IF;

  INSERT INTO public.transactions (
    account_id,
    amount,
    type,
    status,
    description,
    reference,
    transfer_id,
    posted_at,
    ledger_direction
  )
  VALUES (
    p_account_id,
    p_amount,
    p_type,
    'posted',
    p_description,
    COALESCE(p_reference, 'NCU-' || floor(extract(epoch FROM now()) * 1000)::text),
    p_transfer_id,
    COALESCE(p_posted_at, NOW()),
    p_direction
  )
  RETURNING * INTO v_tx;

  UPDATE public.accounts
  SET
    balance = v_next_balance,
    available_balance = v_next_available,
    updated_at = NOW()
  WHERE id = p_account_id;

  RETURN jsonb_build_object(
    'transaction', to_jsonb(v_tx),
    'balance', v_next_balance,
    'available_balance', v_next_available
  );
END;
$$;

REVOKE ALL ON FUNCTION public.post_account_transaction FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.post_account_transaction TO service_role;
