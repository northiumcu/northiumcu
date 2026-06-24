import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  ADMIN_AUTH_PATH,
  isAdminAuthPath,
  isAdminConsolePath,
  isLegacyAdminPath,
} from "@/lib/auth/admin-paths";
import { X_ROBOTS_TAG } from "@/lib/security/crawl-block";

const MEMBER_PREFIX = "/member";

function withCrawlBlock(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", X_ROBOTS_TAG);
  return response;
}

export async function updateSession(request: NextRequest) {
  try {
    return await runSession(request);
  } catch (error) {
    console.error("middleware session error:", error);
    return withCrawlBlock(NextResponse.next({ request }));
  }
}

async function runSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isLegacyAdminPath(pathname)) {
    return withCrawlBlock(
      NextResponse.rewrite(new URL("/not-found", request.url))
    );
  }

  let supabaseResponse = withCrawlBlock(NextResponse.next({ request }));

  if (!isSupabaseConfigured()) {
    if (pathname.startsWith(MEMBER_PREFIX) || isAdminConsolePath(pathname)) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = isAdminConsolePath(pathname)
        ? ADMIN_AUTH_PATH
        : "/sign-in";
      signInUrl.searchParams.set("next", pathname);
      return withCrawlBlock(NextResponse.redirect(signInUrl));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = withCrawlBlock(NextResponse.next({ request }));
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminAuthPath(pathname) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("staff_role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && profile.staff_role !== "member") {
      const consoleUrl = request.nextUrl.clone();
      consoleUrl.pathname = "/hard";
      consoleUrl.search = "";
      return withCrawlBlock(NextResponse.redirect(consoleUrl));
    }
  }

  const isMemberProtected = pathname.startsWith(MEMBER_PREFIX);
  const isStaffProtected = isAdminConsolePath(pathname);

  if (isMemberProtected && !user) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    signInUrl.searchParams.set("next", pathname);
    return withCrawlBlock(NextResponse.redirect(signInUrl));
  }

  if (isStaffProtected && !user) {
    const staffAuthUrl = request.nextUrl.clone();
    staffAuthUrl.pathname = ADMIN_AUTH_PATH;
    staffAuthUrl.searchParams.set("next", pathname);
    return withCrawlBlock(NextResponse.redirect(staffAuthUrl));
  }

  if (isStaffProtected && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("staff_role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.staff_role === "member") {
      const memberUrl = request.nextUrl.clone();
      memberUrl.pathname = "/member";
      memberUrl.search = "";
      return withCrawlBlock(NextResponse.redirect(memberUrl));
    }
  }

  return supabaseResponse;
}
