/**
 * Page visual keys — mapped to unique photography in src/lib/brand/images.ts
 */

export type VisualKey =
  | "hero"
  | "institution"
  | "institutionHero"
  | "accounts"
  | "lending"
  | "cards"
  | "security"
  | "membership"
  | "community"
  | "portal"
  | "support"
  | "collaboration"
  | "application";

export const pageVisuals: Record<string, VisualKey> = {
  "/": "hero",
  "/about": "institution",
  "/membership": "membership",
  "/accounts": "accounts",
  "/loans": "lending",
  "/cards": "cards",
  "/security": "security",
  "/contact": "support",
  "/apply": "application",
  "/sign-in": "portal",
};
