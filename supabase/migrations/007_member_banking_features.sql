-- Member banking: delay mode, avatar, transfer messages, cards, loan applications

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS delay_transactions BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS member_message TEXT,
  ADD COLUMN IF NOT EXISTS admin_decision TEXT,
  ADD COLUMN IF NOT EXISTS pin_verified_at TIMESTAMPTZ;

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS cardholder_name TEXT,
  ADD COLUMN IF NOT EXISTS delivery_eta DATE,
  ADD COLUMN IF NOT EXISTS application_fee_paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS design_variant TEXT DEFAULT 'northium_gold';

ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS purpose TEXT,
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS requested_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC(15, 2);

ALTER TYPE public.card_type ADD VALUE IF NOT EXISTS 'mastercard';

COMMENT ON COLUMN public.profiles.delay_transactions IS 'When true, member transfers require admin approval before debit';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Member profile image data URL or storage path';
