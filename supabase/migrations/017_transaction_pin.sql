-- Separate 4-digit transaction PIN for transfers and other monetary actions.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS transaction_pin_hash TEXT;

ALTER TABLE public.pending_signups
  ADD COLUMN IF NOT EXISTS transaction_pin_hash TEXT;
