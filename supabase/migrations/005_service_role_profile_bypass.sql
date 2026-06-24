-- Allow service_role (seed scripts, server admin client) to set staff fields.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;

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
