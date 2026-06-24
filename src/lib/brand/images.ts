import type { VisualKey } from "@/lib/brand/visuals";

/**
 * Local institutional photography (Unsplash License).
 * Architectural, operational, and security-focused — no commercial stock actors.
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
    src: "/images/banking/bank-hall.webp",
    alt: "Busy Northium branch with teller lines, lounge seating, and member services",
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
};

export const productImages = [
  "/images/banking/product-checking.webp",
  "/images/banking/accounts.webp",
  "/images/banking/security.webp",
  "/images/banking/product-auto.webp",
  "/images/banking/product-planning.webp",
  "/images/banking/cards.webp",
] as const;

export const productImageAlts = [
  "Contactless payment at checkout",
  "Savings and long-term financial growth",
  "Secure certificate deposit storage",
  "Vehicle on a scenic road",
  "Financial planning documents on a desk",
  "Credit card payment terminal",
] as const;
