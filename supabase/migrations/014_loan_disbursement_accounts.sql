-- Loan account type (must commit alone before using the value in later migrations).

ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'loan';
