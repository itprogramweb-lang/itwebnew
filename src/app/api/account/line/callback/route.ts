import { NextRequest, NextResponse } from "next/server";
import { upsertLineConnection } from "@/lib/line/connection";
import {
  consumeLineOAuthState,
  exchangeLineCodeForToken,
  fetchLineProfile,
  getLineLoginEnv,
} from "@/lib/line/oauth";

function getSafeRedirectPath(value: string | null) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/dashboard")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

function buildRedirect(
  request: NextRequest,
  path: string,
  status: "connected" | "error"
) {
  const url = new URL(getSafeRedirectPath(path), request.nextUrl.origin);
  url.searchParams.set("line", status);
  return url;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!getLineLoginEnv() || !code || !state) {
    return NextResponse.redirect(buildRedirect(request, "/dashboard", "error"));
  }

  const stateRow = await consumeLineOAuthState(state);
  if (!stateRow) {
    return NextResponse.redirect(buildRedirect(request, "/dashboard", "error"));
  }

  const redirectPath = getSafeRedirectPath(stateRow.redirect_path);

  try {
    const token = await exchangeLineCodeForToken(code);
    const lineProfile = await fetchLineProfile(token.accessToken);
    await upsertLineConnection(stateRow.user_id, lineProfile);

    return NextResponse.redirect(buildRedirect(request, redirectPath, "connected"));
  } catch (error) {
    console.warn("LINE callback failed", {
      userId: stateRow.user_id,
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.redirect(buildRedirect(request, redirectPath, "error"));
  }
}
