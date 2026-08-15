import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TRUSTED_SITE_URL_ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "APP_URL",
] as const;

function getTrustedSiteOrigin() {
  for (const key of TRUSTED_SITE_URL_ENV_KEYS) {
    const raw = process.env[key]?.trim();

    if (!raw) continue;

    try {
      const url = new URL(raw);
      const hostname = url.hostname.toLowerCase();

      if (url.protocol !== "https:") continue;
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".vercel.app")
      ) continue;

      return url.origin.replace(/\/+$/, "");
    } catch {}
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const trustedSiteOrigin = getTrustedSiteOrigin();

    if (!trustedSiteOrigin) {
      throw new Error("Missing valid site URL for dashboard redirect");
    }

    return NextResponse.redirect(new URL("/login", trustedSiteOrigin));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
