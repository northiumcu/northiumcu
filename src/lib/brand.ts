import { institution, trustPillars } from "@/lib/institution";

export const brand = {
  name: institution.name,
  shortName: institution.shortName,
  tagline: institution.tagline,
  altTagline: institution.secondaryTagline,
  colors: {
    primaryNavy: "#081827",
    secondaryNavy: "#10263A",
    surface: "#F7F9FB",
    white: "#FFFFFF",
    text: "#0B1220",
    muted: "#667085",
    success: "#0F766E",
    gold: "#D4A64A",
    border: "#E5E7EB",
  },
} as const;

export { trustPillars };

export const products = [
  {
    title: "Checking",
    description:
      "Everyday accounts with no monthly fees and nationwide access.",
    href: "/accounts",
  },
  {
    title: "Savings",
    description: "Competitive rates designed to help your money grow steadily.",
    href: "/accounts",
  },
  {
    title: "Certificates",
    description:
      "Fixed-term deposits with guaranteed returns and flexible terms.",
    href: "/accounts",
  },
  {
    title: "Auto Loans",
    description: "Competitive financing for new and pre-owned vehicles.",
    href: "/loans",
  },
  {
    title: "Personal Loans",
    description: "Flexible borrowing for life's important moments.",
    href: "/loans",
  },
  {
    title: "Credit Cards",
    description: "Rewards and premium cards built for responsible spending.",
    href: "/cards",
  },
] as const;

export const whyNorthium = [
  {
    title: "Low Fees",
    description:
      "Transparent pricing with no hidden charges. Member-owned means profits return to you.",
  },
  {
    title: "Member Owned",
    description:
      "Every member is an owner. Your voice shapes how we operate and grow.",
  },
  {
    title: "Secure Banking",
    description:
      "Bank-grade encryption, fraud monitoring, and continuous account protection.",
  },
  {
    title: "Personal Service",
    description: "Dedicated support through secure email and member messaging.",
  },
] as const;

export const securityFeatures = [
  {
    title: "Fraud Monitoring",
    description:
      "Real-time transaction analysis and suspicious activity alerts.",
  },
  {
    title: "Multi-Factor Authentication",
    description: "Additional verification layers to protect every sign-in.",
  },
  {
    title: "Encryption",
    description: "256-bit encryption for data in transit and at rest.",
  },
  {
    title: "Account Alerts",
    description:
      "Instant notifications for balances, transfers, and card activity.",
  },
] as const;
