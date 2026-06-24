-- =============================================================================
-- Northium Credit Union — Phase 5 Database Foundation
-- Governance: INSTITUTION.lock.md · Phase 1A Domain Model · Phase 2 Engineering Lock
-- Rules: RLS on all tables · No anonymous access · Append-only audit_logs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.member_status AS ENUM (
    'prospect', 'applicant', 'verified', 'active', 'dormant', 'suspended', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.staff_role AS ENUM (
    'member', 'support_agent', 'loan_officer', 'compliance_officer',
    'operations_manager', 'administrator', 'super_administrator'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM (
    'pending', 'active', 'restricted', 'dormant', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.account_type AS ENUM (
    'checking', 'savings', 'certificate', 'youth', 'business', 'retirement'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM (
    'deposit', 'withdrawal', 'transfer', 'interest', 'fee', 'adjustment', 'refund', 'reversal'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM (
    'pending', 'posted', 'reversed', 'disputed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transfer_status AS ENUM (
    'draft', 'pending', 'pending_approval', 'processing', 'completed', 'failed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transfer_type AS ENUM (
    'internal', 'external', 'scheduled', 'recurring'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.card_status AS ENUM (
    'ordered', 'issued', 'pending_activation', 'active', 'frozen', 'expired', 'cancelled', 'replaced'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.card_type AS ENUM (
    'debit', 'rewards', 'premium', 'travel', 'virtual'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.loan_status AS ENUM (
    'application', 'underwriting', 'approved', 'funded', 'active',
    'delinquent', 'paid', 'charged_off', 'denied', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.loan_type AS ENUM (
    'auto', 'personal', 'home', 'business', 'student'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM (
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Security helper functions (SECURITY DEFINER — avoids RLS recursion)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  member_number TEXT UNIQUE,
  member_status public.member_status NOT NULL DEFAULT 'applicant',
  staff_role public.staff_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- RBAC
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.profile_roles (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id),
  PRIMARY KEY (profile_id, role_id)
);

-- ---------------------------------------------------------------------------
-- Membership applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  status public.application_status NOT NULL DEFAULT 'draft',
  eligibility_category TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.membership_applications(id) ON DELETE CASCADE,
  from_status public.application_status,
  to_status public.application_status NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  account_number TEXT NOT NULL UNIQUE,
  type public.account_type NOT NULL,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  available_balance NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  status public.account_status NOT NULL DEFAULT 'pending',
  product_slug TEXT,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Transactions (immutable ledger entries)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  type public.transaction_type NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  description TEXT NOT NULL,
  reference TEXT,
  idempotency_key TEXT UNIQUE,
  related_transaction_id UUID REFERENCES public.transactions(id),
  transfer_id UUID,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Transfers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  source_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  destination_account_id UUID REFERENCES public.accounts(id) ON DELETE RESTRICT,
  type public.transfer_type NOT NULL DEFAULT 'internal',
  status public.transfer_status NOT NULL DEFAULT 'draft',
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  memo TEXT,
  scheduled_for TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  approved_by UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_transfer_id_fkey;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_transfer_id_fkey
  FOREIGN KEY (transfer_id) REFERENCES public.transfers(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Cards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  linked_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  card_type public.card_type NOT NULL,
  last_four TEXT NOT NULL CHECK (last_four ~ '^\d{4}$'),
  status public.card_status NOT NULL DEFAULT 'ordered',
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Loans
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  loan_type public.loan_type NOT NULL,
  principal_amount NUMERIC(15, 2) NOT NULL CHECK (principal_amount > 0),
  outstanding_balance NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (outstanding_balance >= 0),
  interest_rate NUMERIC(6, 4),
  term_months INTEGER NOT NULL CHECK (term_months > 0),
  status public.loan_status NOT NULL DEFAULT 'application',
  funded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Audit logs (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  reason_code TEXT,
  reason_note TEXT,
  state_before JSONB,
  state_after JSONB,
  ip_address INET,
  user_agent TEXT,
  channel TEXT NOT NULL DEFAULT 'system',
  correlation_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'transactional',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  security_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Domain events (event store)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL DEFAULT 1,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  actor_role TEXT,
  correlation_id UUID,
  causation_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Institution settings (admin-configured — no invented defaults)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institution_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Security helper functions (after tables — SQL bodies validate at create time)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND staff_role <> 'member'::public.staff_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND staff_role IN (
        'administrator'::public.staff_role,
        'super_administrator'::public.staff_role,
        'operations_manager'::public.staff_role,
        'compliance_officer'::public.staff_role
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_account(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.accounts
    WHERE id = p_account_id
      AND member_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_member_status ON public.profiles(member_status);
CREATE INDEX IF NOT EXISTS idx_profiles_staff_role ON public.profiles(staff_role);
CREATE INDEX IF NOT EXISTS idx_accounts_member_id ON public.accounts(member_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON public.accounts(status);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_member_id ON public.transfers(member_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfers(status);
CREATE INDEX IF NOT EXISTS idx_cards_member_id ON public.cards(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_member_id ON public.loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate ON public.domain_events(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_domain_events_type ON public.domain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_domain_events_created_at ON public.domain_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_membership_applications_status ON public.membership_applications(status);
CREATE INDEX IF NOT EXISTS idx_membership_applications_email ON public.membership_applications(email);

-- ---------------------------------------------------------------------------
-- Updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS accounts_set_updated_at ON public.accounts;
CREATE TRIGGER accounts_set_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS transfers_set_updated_at ON public.transfers;
CREATE TRIGGER transfers_set_updated_at
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS cards_set_updated_at ON public.cards;
CREATE TRIGGER cards_set_updated_at
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS loans_set_updated_at ON public.loans;
CREATE TRIGGER loans_set_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth trigger — auto-create profile
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, member_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'applicant'
  );

  INSERT INTO public.notification_preferences (profile_id)
  VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Audit immutability — block updates and deletes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_no_update ON public.audit_logs;
CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_mutation();

DROP TRIGGER IF EXISTS audit_logs_no_delete ON public.audit_logs;
CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_mutation();

-- ---------------------------------------------------------------------------
-- Revoke anonymous access
-- ---------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_settings ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_staff_manage ON public.profiles;
CREATE POLICY profiles_staff_manage ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RBAC tables — admin read, super admin write (via is_admin for Phase 5)
DROP POLICY IF EXISTS roles_staff_read ON public.roles;
CREATE POLICY roles_staff_read ON public.roles
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS permissions_staff_read ON public.permissions;
CREATE POLICY permissions_staff_read ON public.permissions
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS role_permissions_staff_read ON public.role_permissions;
CREATE POLICY role_permissions_staff_read ON public.role_permissions
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS profile_roles_staff_read ON public.profile_roles;
CREATE POLICY profile_roles_staff_read ON public.profile_roles
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS rbac_admin_write ON public.roles;
CREATE POLICY rbac_admin_write ON public.roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS permissions_admin_write ON public.permissions;
CREATE POLICY permissions_admin_write ON public.permissions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS role_permissions_admin_write ON public.role_permissions;
CREATE POLICY role_permissions_admin_write ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profile_roles_admin_write ON public.profile_roles;
CREATE POLICY profile_roles_admin_write ON public.profile_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Membership applications
DROP POLICY IF EXISTS applications_select_own ON public.membership_applications;
CREATE POLICY applications_select_own ON public.membership_applications
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS applications_insert_own ON public.membership_applications;
CREATE POLICY applications_insert_own ON public.membership_applications
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() OR profile_id IS NULL);

DROP POLICY IF EXISTS applications_staff_manage ON public.membership_applications;
CREATE POLICY applications_staff_manage ON public.membership_applications
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS application_history_staff_read ON public.application_status_history;
CREATE POLICY application_history_staff_read ON public.application_status_history
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS application_history_staff_insert ON public.application_status_history;
CREATE POLICY application_history_staff_insert ON public.application_status_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

-- Accounts
DROP POLICY IF EXISTS accounts_select_own ON public.accounts;
CREATE POLICY accounts_select_own ON public.accounts
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS accounts_staff_manage ON public.accounts;
CREATE POLICY accounts_staff_manage ON public.accounts
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Transactions — members read own; inserts via service role only
DROP POLICY IF EXISTS transactions_select_own ON public.transactions;
CREATE POLICY transactions_select_own ON public.transactions
  FOR SELECT TO authenticated
  USING (public.owns_account(account_id) OR public.is_staff());

-- Transfers
DROP POLICY IF EXISTS transfers_select_own ON public.transfers;
CREATE POLICY transfers_select_own ON public.transfers
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS transfers_insert_own ON public.transfers;
CREATE POLICY transfers_insert_own ON public.transfers
  FOR INSERT TO authenticated
  WITH CHECK (member_id = auth.uid());

DROP POLICY IF EXISTS transfers_update_own ON public.transfers;
CREATE POLICY transfers_update_own ON public.transfers
  FOR UPDATE TO authenticated
  USING (member_id = auth.uid() AND status IN ('draft', 'pending'))
  WITH CHECK (member_id = auth.uid());

DROP POLICY IF EXISTS transfers_staff_manage ON public.transfers;
CREATE POLICY transfers_staff_manage ON public.transfers
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Cards
DROP POLICY IF EXISTS cards_select_own ON public.cards;
CREATE POLICY cards_select_own ON public.cards
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS cards_update_own ON public.cards;
CREATE POLICY cards_update_own ON public.cards
  FOR UPDATE TO authenticated
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

DROP POLICY IF EXISTS cards_staff_manage ON public.cards;
CREATE POLICY cards_staff_manage ON public.cards
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Loans
DROP POLICY IF EXISTS loans_select_own ON public.loans;
CREATE POLICY loans_select_own ON public.loans
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS loans_staff_manage ON public.loans;
CREATE POLICY loans_staff_manage ON public.loans
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Audit logs — staff read, authenticated insert own actor
DROP POLICY IF EXISTS audit_logs_staff_read ON public.audit_logs;
CREATE POLICY audit_logs_staff_read ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.is_staff());

-- Notifications
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notification preferences
DROP POLICY IF EXISTS notification_prefs_own ON public.notification_preferences;
CREATE POLICY notification_prefs_own ON public.notification_preferences
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Domain events — staff read only; inserts via service role
DROP POLICY IF EXISTS domain_events_staff_read ON public.domain_events;
CREATE POLICY domain_events_staff_read ON public.domain_events
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- Institution settings — staff read, admin write
DROP POLICY IF EXISTS institution_settings_staff_read ON public.institution_settings;
CREATE POLICY institution_settings_staff_read ON public.institution_settings
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS institution_settings_admin_write ON public.institution_settings;
CREATE POLICY institution_settings_admin_write ON public.institution_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed RBAC roles and permissions (structural only — no invented banking data)
-- ---------------------------------------------------------------------------
INSERT INTO public.roles (slug, name, description) VALUES
  ('member', 'Member', 'Standard member-owner'),
  ('support_agent', 'Support Agent', 'Frontline member servicing'),
  ('loan_officer', 'Loan Officer', 'Lending origination and underwriting'),
  ('compliance_officer', 'Compliance Officer', 'KYC, AML, and regulatory oversight'),
  ('operations_manager', 'Operations Manager', 'Day-to-day institutional operations'),
  ('administrator', 'Administrator', 'Broad operational control'),
  ('super_administrator', 'Super Administrator', 'Institutional control plane')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.permissions (slug, description) VALUES
  ('member:profile:read', 'Read own profile'),
  ('member:profile:write', 'Update own profile'),
  ('member:accounts:read', 'Read own accounts'),
  ('member:transfers:create', 'Create transfers'),
  ('member:cards:read', 'Read own cards'),
  ('member:cards:write', 'Manage own card controls'),
  ('member:loans:read', 'Read own loans'),
  ('member:statements:read', 'Read own statements'),
  ('member:notifications:read', 'Read own notifications'),
  ('member:security:read', 'Read security settings'),
  ('member:security:write', 'Update security settings'),
  ('admin:members:read', 'View member records'),
  ('admin:members:write', 'Modify member records'),
  ('admin:applications:read', 'View membership applications'),
  ('admin:applications:approve', 'Approve or reject applications'),
  ('admin:accounts:read', 'View all accounts'),
  ('admin:accounts:write', 'Manage accounts'),
  ('admin:loans:read', 'View loan pipeline'),
  ('admin:loans:approve', 'Approve or deny loans'),
  ('admin:fraud:read', 'View fraud alerts'),
  ('admin:fraud:write', 'Manage fraud cases'),
  ('admin:audit:read', 'View audit logs'),
  ('admin:reports:export', 'Export institutional reports'),
  ('admin:settings:write', 'Modify institution settings')
ON CONFLICT (slug) DO NOTHING;

-- Seed institution identity from lock file (not invented)
INSERT INTO public.institution_settings (key, value) VALUES
  ('identity', '{"name":"Northium Credit Union","shortName":"Northium","domain":"northiumcu.com","supportEmail":"helpdesk@northiumcu.com","tagline":"Banking Built On Trust."}'),
  ('headquarters', '{"street":"727 E Campbell Rd","city":"Richardson","state":"TX","postalCode":"75081","country":"United States"}')
ON CONFLICT (key) DO NOTHING;
