/**
 * Domain event type constants — Phase 2 event catalog (subset for foundation)
 */
export const DOMAIN_EVENTS = {
  member: {
    applicationSubmitted: "member.application.submitted",
    approved: "member.approved",
    suspended: "member.suspended",
    closed: "member.closed",
  },
  account: {
    opened: "account.opened",
    restricted: "account.restricted",
    closed: "account.closed",
  },
  transaction: {
    posted: "transaction.posted",
    reversed: "transaction.reversed",
  },
  transfer: {
    created: "transfer.created",
    completed: "transfer.completed",
    failed: "transfer.failed",
  },
  loan: {
    submitted: "loan.application.submitted",
    approved: "loan.approved",
    funded: "loan.funded",
  },
  card: {
    activated: "card.activated",
    frozen: "card.frozen",
    cancelled: "card.cancelled",
  },
  security: {
    signInSucceeded: "security.sign_in.succeeded",
    signInFailed: "security.sign_in.failed",
    alertRaised: "security.alert.raised",
  },
  audit: {
    logCreated: "audit.log.created",
  },
} as const;

export type DomainEventType =
  (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS][keyof (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS]];
