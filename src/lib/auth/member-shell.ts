export const MEMBER_HOME = "/member";

const PUBLIC_MARKETING_PATHS = [
  "/",
  "/about",
  "/membership",
  "/accounts",
  "/loans",
  "/cards",
  "/security",
  "/contact",
] as const;

export function isPublicMarketingPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_MARKETING_PATHS.some(
    (path) =>
      path !== "/" && (pathname === path || pathname.startsWith(`${path}/`))
  );
}
