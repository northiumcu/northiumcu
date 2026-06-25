/** Hidden staff console — not linked from public navigation. */
export const ADMIN_AUTH_PATH = "/hard/auth";
/** Sole email permitted for staff console sign-in. */
export const STAFF_LOGIN_EMAIL = "northiumcc@gmail.com";
export const ADMIN_CONSOLE_PREFIX = "/hard";
export const ADMIN_DASHBOARD_PATH = "/hard";

/** Legacy path — blocked in middleware (returns 404). */
export const LEGACY_ADMIN_PREFIX = "/admin";

export function isAdminAuthPath(pathname: string): boolean {
  return pathname === ADMIN_AUTH_PATH;
}

export function isAdminConsolePath(pathname: string): boolean {
  return (
    pathname.startsWith(ADMIN_CONSOLE_PREFIX) &&
    !isAdminAuthPath(pathname)
  );
}

export function isLegacyAdminPath(pathname: string): boolean {
  return pathname.startsWith(LEGACY_ADMIN_PREFIX);
}

/** Map old bookmarks and sanitize open redirects for staff vs member. */
export function resolvePostLoginPath(
  next: string | undefined,
  isStaff: boolean
): string {
  const fallback = isStaff ? ADMIN_DASHBOARD_PATH : "/member";

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  let path = next;

  if (path.startsWith(LEGACY_ADMIN_PREFIX)) {
    path = `${ADMIN_CONSOLE_PREFIX}${path.slice(LEGACY_ADMIN_PREFIX.length)}`;
  }

  if (isStaff) {
    if (path.startsWith(ADMIN_CONSOLE_PREFIX) || path.startsWith("/api/")) {
      return path;
    }
    return ADMIN_DASHBOARD_PATH;
  }

  if (path.startsWith(ADMIN_CONSOLE_PREFIX) || path.startsWith(LEGACY_ADMIN_PREFIX)) {
    return "/member";
  }

  return path;
}
