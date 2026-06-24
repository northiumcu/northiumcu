import type {
  AccountStatus,
  AccountType,
  ApplicationStatus,
  CardStatus,
  CardType,
  LoanStatus,
  LoanType,
  MemberStatus,
  StaffRole,
  TransactionStatus,
  TransactionType,
  TransferStatus,
  TransferType,
} from "@/lib/database/enums";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  member_number: string | null;
  member_status: MemberStatus;
  staff_role: StaffRole;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Permission {
  id: string;
  slug: string;
  description: string;
  created_at: string;
}

export interface MembershipApplication {
  id: string;
  profile_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: ApplicationStatus;
  eligibility_category: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  member_id: string;
  account_number: string;
  type: AccountType;
  balance: number;
  available_balance: number;
  status: AccountStatus;
  product_slug: string | null;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  reference: string | null;
  idempotency_key: string | null;
  related_transaction_id: string | null;
  transfer_id: string | null;
  posted_at: string | null;
  created_at: string;
}

export interface Transfer {
  id: string;
  member_id: string;
  source_account_id: string;
  destination_account_id: string | null;
  type: TransferType;
  status: TransferStatus;
  amount: number;
  memo: string | null;
  scheduled_for: string | null;
  idempotency_key: string | null;
  risk_score: number | null;
  approved_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  member_id: string;
  linked_account_id: string | null;
  card_type: CardType;
  last_four: string;
  status: CardStatus;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  member_id: string;
  loan_type: LoanType;
  principal_amount: number;
  outstanding_balance: number;
  interest_rate: number | null;
  term_months: number;
  status: LoanStatus;
  funded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  reason_code: string | null;
  reason_note: string | null;
  state_before: Record<string, unknown> | null;
  state_after: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  channel: string;
  correlation_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  profile_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  security_alerts_enabled: boolean;
  updated_at: string;
}

export interface DomainEvent {
  id: string;
  event_type: string;
  event_version: number;
  aggregate_type: string;
  aggregate_id: string;
  actor_id: string | null;
  actor_role: string | null;
  correlation_id: string | null;
  causation_id: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface InstitutionSetting {
  key: string;
  value: Record<string, unknown>;
  updated_by: string | null;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      accounts: {
        Row: Account;
        Insert: Partial<Account>;
        Update: Partial<Account>;
      };
      transactions: {
        Row: Transaction;
        Insert: Partial<Transaction>;
        Update: Partial<Transaction>;
      };
      transfers: {
        Row: Transfer;
        Insert: Partial<Transfer>;
        Update: Partial<Transfer>;
      };
      cards: { Row: Card; Insert: Partial<Card>; Update: Partial<Card> };
      loans: { Row: Loan; Insert: Partial<Loan>; Update: Partial<Loan> };
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: never };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification>;
        Update: Partial<Notification>;
      };
      membership_applications: {
        Row: MembershipApplication;
        Insert: Partial<MembershipApplication>;
        Update: Partial<MembershipApplication>;
      };
      domain_events: {
        Row: DomainEvent;
        Insert: Partial<DomainEvent>;
        Update: never;
      };
      institution_settings: {
        Row: InstitutionSetting;
        Insert: Partial<InstitutionSetting>;
        Update: Partial<InstitutionSetting>;
      };
    };
  };
}
