/**
 * Page visual keys — mapped to photography in src/lib/brand/images.ts
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
  | "portal";

export const pageVisuals: Record<string, VisualKey> = {
  "/": "hero",
  "/about": "institution",
  "/membership": "membership",
  "/accounts": "accounts",
  "/loans": "lending",
  "/cards": "cards",
  "/security": "security",
  "/contact": "community",
  "/apply": "membership",
  "/sign-in": "portal",
};
