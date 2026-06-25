-- PIN reset OTP purpose

ALTER TYPE public.otp_purpose ADD VALUE IF NOT EXISTS 'pin_reset';
