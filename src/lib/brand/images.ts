import type { VisualKey } from "@/lib/brand/visuals";

/**
 * Local institutional photography (Unsplash License).
 * Each visual key maps to a unique image — no duplicates across sections.
 */

export interface BankingPhoto {
  src: string;
  alt: string;
}

export const bankingImages: Record<VisualKey, BankingPhoto> = {
  hero: {
    src: "/images/banking/hero.webp",
    alt: "Modern glass institutional building at dusk",
  },
  institution: {
    src: "/images/banking/bank-hall.webp",
    alt: "Northium Credit Union branch with members and staff throughout the hall",
  },
  institutionHero: {
    src: "/images/banking/teller-service.webp",
    alt: "Member services team reviewing accounts at a consultation desk",
  },
  accounts: {
    src: "/images/banking/accounts.webp",
    alt: "Hands planting coins in soil representing steady savings growth",
  },
  lending: {
    src: "/images/banking/lending.webp",
    alt: "House keys on a wooden surface representing home lending",
  },
  cards: {
    src: "/images/banking/cards.webp",
    alt: "Contactless card payment at a point of sale",
  },
  security: {
    src: "/images/banking/security.webp",
    alt: "Steel bank vault door with combination lock",
  },
  membership: {
    src: "/images/banking/membership.webp",
    alt: "Group of people walking together in an open landscape",
  },
  community: {
    src: "/images/banking/community.webp",
    alt: "Bright modern office workspace with natural light",
  },
  portal: {
    src: "/images/banking/portal.webp",
    alt: "Contemporary office interior with collaborative seating",
  },
  support: {
    src: "/images/banking/member-support.webp",
    alt: "Member support specialist ready to assist by phone and email",
  },
  collaboration: {
    src: "/images/banking/team-collaboration.webp",
    alt: "Northium team collaborating on member service initiatives",
  },
  application: {
    src: "/images/banking/product-planning.webp",
    alt: "Membership application and account opening documents on a desk",
  },
};

export const productImages = [
  "/images/banking/product-checking.webp",
  "/images/banking/product-savings.webp",
  "/images/banking/product-certificate.webp",
  "/images/banking/product-auto.webp",
  "/images/banking/product-planning.webp",
  "/images/banking/product-cards.webp",
] as const;

export const productImageAlts = [
  "Contactless payment at checkout",
  "Piggy bank representing steady savings growth",
  "Financial documents for fixed-term certificate planning",
  "Vehicle on a scenic road for auto financing",
  "Financial planning documents for personal lending",
  "Card payment at a retail terminal",
] as const;
