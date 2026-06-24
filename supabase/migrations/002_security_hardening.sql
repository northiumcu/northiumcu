-- =============================================================================
-- Northium Credit Union — Phase 5b Security Hardening
-- SEC-001: Profile column protection
-- SEC-003: Explicit table grants
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Prevent members from self-elevating staff_role or member_status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.staff_role IS DISTINCT FROM OLD.staff_role THEN
    RAISE EXCEPTION 'staff_role cannot be modified by members';
  END IF;

  IF NEW.member_status IS DISTINCT FROM OLD.member_status THEN
    RAISE EXCEPTION 'member_status cannot be modified by members';
  END IF;

  IF NEW.member_number IS DISTINCT FROM OLD.member_number THEN
    RAISE EXCEPTION 'member_number cannot be modified by members';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_privileged_columns ON public.profiles;
CREATE TRIGGER profiles_protect_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- ---------------------------------------------------------------------------
-- Explicit grants for authenticated and service_role
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Audit logs remain append-only via trigger; UPDATE/DELETE blocked at DB level
-- Domain events: inserts should be service_role only in production (Phase 7)

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
