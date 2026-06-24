import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { X_ROBOTS_TAG } from "@/lib/security/crawl-block";

const MEMBER_PREFIX = "/member";
const ADMIN_PREFIX = "/admin";

function withCrawlBlock(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", X_ROBOTS_TAG);
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = withCrawlBlock(NextResponse.next({ request }));
  const pathname = request.nextUrl.pathname;

  if (!isSupabaseConfigured()) {
    if (
      pathname.startsWith(MEMBER_PREFIX) ||
      pathname.startsWith(ADMIN_PREFIX)
    ) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = "/sign-in";
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

  const isProtected =
    pathname.startsWith(MEMBER_PREFIX) || pathname.startsWith(ADMIN_PREFIX);

  if (isProtected && !user) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    signInUrl.searchParams.set("next", pathname);
    return withCrawlBlock(NextResponse.redirect(signInUrl));
  }

  if (pathname.startsWith(ADMIN_PREFIX) && user) {
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
