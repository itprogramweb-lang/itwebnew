import { NextRequest, NextResponse } from "next/server";
import {
  buildLineLoginUrl,
  createLineOAuthState,
  getLineLoginEnv,
} from "@/lib/line/oauth";
import { getAuthenticatedProfile } from "@/lib/serverAuth";

function getSafeRedirectPath(value: string | null) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/dashboard")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

async function handleConnect(request: NextRequest) {
  if (!getLineLoginEnv()) {
    return NextResponse.json(
      { error: "LINE account linking is not configured." },
      { status: 503 }
    );
  }

  const profile = await getAuthenticatedProfile(request);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let redirectPath = request.nextUrl.searchParams.get("redirect");

  if (request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as {
      redirect_path?: unknown;
    };
    if (typeof body.redirect_path === "string") {
      redirectPath = body.redirect_path;
    }
  }

  try {
    const oauthState = await createLineOAuthState(
      profile.id,
      getSafeRedirectPath(redirectPath)
    );
    const authorizationUrl = buildLineLoginUrl(oauthState.rawState);

    return NextResponse.json({
      authorizationUrl,
      expiresAt: oauthState.expiresAt,
    });
  } catch (error) {
    console.warn("LINE connect start failed", {
      userId: profile.id,
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { error: "Unable to start LINE account linking." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleConnect(request);
}

export async function POST(request: NextRequest) {
  return handleConnect(request);
}
