-- Member controls: employer, state, transfer security codes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employer_company_name TEXT,
  ADD COLUMN IF NOT EXISTS address_state TEXT,
  ADD COLUMN IF NOT EXISTS cot_code_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS imf_code_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS cot_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS imf_required BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.cot_code_encrypted IS 'Encrypted COT code — admin only via service role';
COMMENT ON COLUMN public.profiles.imf_code_encrypted IS 'Encrypted IMF code — admin only via service role';
