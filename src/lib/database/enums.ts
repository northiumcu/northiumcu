/**
 * Database enums — mirrors PostgreSQL types in 001_database_foundation.sql
 * DO NOT duplicate. Single source for application-layer enum literals.
 */

export const MEMBER_STATUSES = [
  "prospect",
  "applicant",
  "verified",
  "active",
  "paused",
  "dormant",
  "suspended",
  "closed",
] as const;

export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const STAFF_ROLES = [
  "member",
  "support_agent",
  "loan_officer",
  "compliance_officer",
  "operations_manager",
  "administrator",
  "super_administrator",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ACCOUNT_STATUSES = [
  "pending",
  "active",
  "restricted",
  "dormant",
  "closed",
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "certificate",
  "youth",
  "business",
  "retirement",
  "loan",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const TRANSACTION_TYPES = [
  "deposit",
  "withdrawal",
  "transfer",
  "interest",
  "fee",
  "adjustment",
  "refund",
  "reversal",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = [
  "pending",
  "posted",
  "reversed",
  "disputed",
  "failed",
] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TRANSFER_STATUSES = [
  "draft",
  "pending",
  "pending_approval",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const TRANSFER_TYPES = [
  "internal",
  "external",
  "scheduled",
  "recurring",
  "ach",
  "direct_deposit",
  "local_wire",
  "international_wire",
  "zelle",
  "bill_pay",
] as const;

export type TransferType = (typeof TRANSFER_TYPES)[number];

export const CARD_STATUSES = [
  "ordered",
  "issued",
  "pending_activation",
  "active",
  "frozen",
  "expired",
  "cancelled",
  "replaced",
] as const;

export type CardStatus = (typeof CARD_STATUSES)[number];

export const CARD_TYPES = [
  "debit",
  "rewards",
  "premium",
  "travel",
  "virtual",
  "mastercard",
] as const;

export type CardType = (typeof CARD_TYPES)[number];

export const LOAN_STATUSES = [
  "application",
  "underwriting",
  "approved",
  "funded",
  "active",
  "delinquent",
  "paid",
  "charged_off",
  "denied",
  "closed",
] as const;

export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const LOAN_TYPES = [
  "auto",
  "personal",
  "home",
  "business",
  "student",
] as const;

export type LoanType = (typeof LOAN_TYPES)[number];

export const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const TABLE_NAMES = {
  profiles: "profiles",
  roles: "roles",
  permissions: "permissions",
  rolePermissions: "role_permissions",
  profileRoles: "profile_roles",
  membershipApplications: "membership_applications",
  applicationStatusHistory: "application_status_history",
  accounts: "accounts",
  transactions: "transactions",
  transfers: "transfers",
  cards: "cards",
  loans: "loans",
  auditLogs: "audit_logs",
  notifications: "notifications",
  notificationPreferences: "notification_preferences",
  domainEvents: "domain_events",
  institutionSettings: "institution_settings",
} as const;
