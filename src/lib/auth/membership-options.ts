import type { AccountType } from "@/lib/database/enums";

export const ELIGIBILITY_OPTIONS = [
  "Open to all — national membership",
  "Resident of qualifying county",
  "Employee of partner organization",
  "Family member of current member",
  "Community organization member",
] as const;

/** Primary account choices in signup — savings is always included automatically. */
export const PRIMARY_MEMBERSHIP_ACCOUNT_OPTIONS: {
  value: AccountType;
  label: string;
}[] = [
  { value: "checking", label: "Checking" },
  { value: "certificate", label: "Share Certificate" },
  { value: "youth", label: "Youth Account" },
  { value: "business", label: "Business" },
  { value: "retirement", label: "Retirement (IRA)" },
];

export function accountTypesWithSavings(primary: AccountType): AccountType[] {
  if (primary === "savings") return ["savings"];
  return [primary, "savings"];
}

export const MEMBERSHIP_ACCOUNT_OPTIONS: {
  value: AccountType;
  label: string;
  description: string;
}[] = [
  {
    value: "checking",
    label: "Checking",
    description: "Everyday spending & debit card",
  },
  {
    value: "savings",
    label: "Savings",
    description: "Earn dividends on your balance",
  },
  {
    value: "certificate",
    label: "Share Certificate",
    description: "Fixed-term savings (CD)",
  },
  {
    value: "youth",
    label: "Youth Account",
    description: "For members under 18",
  },
  {
    value: "business",
    label: "Business",
    description: "Business banking & services",
  },
  {
    value: "retirement",
    label: "Retirement (IRA)",
    description: "Tax-advantaged savings",
  },
];

export const ID_DOCUMENT_OPTIONS = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "state_id", label: "State ID" },
  { value: "passport", label: "Passport" },
] as const;
