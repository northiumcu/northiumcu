-- Encrypted card credentials issued after admin approval

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS pan_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS cvv_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

COMMENT ON COLUMN public.cards.pan_encrypted IS 'AES-256-GCM encrypted 16-digit PAN';
COMMENT ON COLUMN public.cards.cvv_encrypted IS 'AES-256-GCM encrypted 3-digit CVV';
