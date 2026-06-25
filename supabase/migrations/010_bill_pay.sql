-- Bill Pay: payees, transfer type, per-member toggle

ALTER TYPE public.transfer_type ADD VALUE IF NOT EXISTS 'bill_pay';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bill_pay_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS payee_id UUID;

CREATE TABLE IF NOT EXISTS public.bill_pay_payees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  payee_name TEXT NOT NULL,
  account_number_encrypted TEXT NOT NULL,
  account_last_four TEXT NOT NULL CHECK (account_last_four ~ '^\d{4}$'),
  routing_number TEXT NOT NULL CHECK (routing_number ~ '^\d{9}$'),
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bill_pay_payees_member_idx
  ON public.bill_pay_payees (member_id, is_active, created_at DESC);

ALTER TABLE public.transfers
  DROP CONSTRAINT IF EXISTS transfers_payee_id_fkey;

ALTER TABLE public.transfers
  ADD CONSTRAINT transfers_payee_id_fkey
  FOREIGN KEY (payee_id) REFERENCES public.bill_pay_payees(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.bill_pay_enabled IS 'When false, member cannot access bill pay or pay saved payees';

ALTER TABLE public.bill_pay_payees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bill_pay_payees_select_own ON public.bill_pay_payees;
CREATE POLICY bill_pay_payees_select_own ON public.bill_pay_payees
  FOR SELECT USING (member_id = auth.uid());

DROP POLICY IF EXISTS bill_pay_payees_insert_own ON public.bill_pay_payees;
CREATE POLICY bill_pay_payees_insert_own ON public.bill_pay_payees
  FOR INSERT WITH CHECK (member_id = auth.uid());

DROP POLICY IF EXISTS bill_pay_payees_update_own ON public.bill_pay_payees;
CREATE POLICY bill_pay_payees_update_own ON public.bill_pay_payees
  FOR UPDATE USING (member_id = auth.uid());

DROP POLICY IF EXISTS bill_pay_payees_staff_manage ON public.bill_pay_payees;
CREATE POLICY bill_pay_payees_staff_manage ON public.bill_pay_payees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND staff_role IN (
          'administrator',
          'super_administrator',
          'operations_manager',
          'compliance_officer',
          'support_agent'
        )
    )
  );
