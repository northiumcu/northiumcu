/**
 * CANONICAL INSTITUTION IDENTITY
 *
 * Source of truth: INSTITUTION.lock.md
 * DO NOT MODIFY WITHOUT EXECUTIVE APPROVAL
 *
 * All UI, notifications, emails, legal pages, and support systems
 * must import from this module — never hardcode institutional values.
 */

export const institution = {
  name: "Northium Credit Union",
  shortName: "Northium",
  domain: "northiumcu.com",
  productionUrl: "https://northiumcu.com",
  supportEmail: "helpdesk@northiumcu.com",
  headquarters: {
    street: "727 E Campbell Rd",
    city: "Richardson",
    state: "TX",
    postalCode: "75081",
    country: "United States",
  },
  tagline: "Banking Built On Trust.",
  secondaryTagline: "Generations Ahead.",
  supportChannels: {
    primary: "email" as const,
    secondary: "secure_messaging" as const,
    future: ["phone", "live_chat"] as const,
  },
  voice: {
    use: [
      "Professional",
      "Confident",
      "Calm",
      "Clear",
      "Institutional",
      "Helpful",
      "Human",
    ],
    avoid: [
      "Hype language",
      "Startup buzzwords",
      "Crypto terminology",
      "Aggressive sales language",
    ],
  },
  positioning: {
    is: [
      "Trust",
      "Security",
      "Longevity",
      "Financial Responsibility",
      "Member Ownership",
      "Institutional Stability",
    ],
    isNot: [
      "A fintech startup",
      "A crypto platform",
      "A trading platform",
      "A social finance platform",
      "A payment app",
    ],
  },
  legalPages: [
    { slug: "privacy", title: "Privacy Policy" },
    { slug: "terms", title: "Terms of Service" },
    { slug: "e-communications", title: "Electronic Communications Consent" },
    { slug: "security-policy", title: "Security Policy" },
    { slug: "cookies", title: "Cookie Policy" },
    { slug: "accessibility", title: "Accessibility Statement" },
    { slug: "member-agreement", title: "Member Agreement" },
    { slug: "account-agreement", title: "Account Agreement" },
    { slug: "loan-agreement", title: "Loan Agreement" },
    { slug: "cardholder-agreement", title: "Cardholder Agreement" },
  ],
} as const;

/** Formatted single-line headquarters address */
export function formatHeadquartersAddress(): string {
  const { street, city, state, postalCode } = institution.headquarters;
  return `${street}, ${city}, ${state} ${postalCode}`;
}

/** Formatted multi-line headquarters address for display */
export function formatHeadquartersAddressMultiline(): string[] {
  const { street, city, state, postalCode, country } = institution.headquarters;
  return [institution.name, street, `${city}, ${state} ${postalCode}`, country];
}

/** Institutional trust pillars — no invented metrics */
export const trustPillars = [
  {
    title: "Trust",
    description: "Member-owned governance with transparent, honest banking.",
  },
  {
    title: "Security",
    description:
      "Institutional-grade protection for every account and sign-in.",
  },
  {
    title: "Longevity",
    description:
      "Built to serve members across generations, not quarterly targets.",
  },
  {
    title: "Stability",
    description: "Prudent operations focused on lasting financial strength.",
  },
] as const;
