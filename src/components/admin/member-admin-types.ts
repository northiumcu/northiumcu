export interface MemberAccount {
  id: string;
  account_number: string;
  type: string;
  balance: number;
  available_balance: number;
  status: string;
}

export interface MemberRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  member_status: string;
  member_number: string | null;
  employer_company_name: string | null;
  address_state: string | null;
  delay_transactions: boolean;
  bill_pay_enabled: boolean;
  pause_transfers: boolean;
  transfer_pause_reason: string | null;
  cot_required: boolean;
  imf_required: boolean;
  has_cot_code?: boolean;
  has_imf_code?: boolean;
  accounts: MemberAccount[] | null;
}

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;
