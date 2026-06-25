-- Admin-controlled transfer pause with member-facing reason message.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pause_transfers BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS transfer_pause_reason TEXT;

COMMENT ON COLUMN public.profiles.pause_transfers IS 'When true, member transfers stop after PIN verification with transfer_pause_reason';
COMMENT ON COLUMN public.profiles.transfer_pause_reason IS 'Message shown to member when a transfer is paused';
