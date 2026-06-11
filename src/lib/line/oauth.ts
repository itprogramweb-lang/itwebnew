import "server-only";

import crypto from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const LINE_AUTHORIZE_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

type LineLoginEnv = {
  channelId: string;
  channelSecret: string;
  callbackUrl: string;
};

export type LineProfile = {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
};

type LineTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

export type LineOAuthStateRow = {
  id: string;
  user_id: string;
  state_hash: string;
  redirect_path: string | null;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
};

export function getLineLoginEnv(): LineLoginEnv | null {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;
  const callbackUrl = process.env.LINE_LOGIN_CALLBACK_URL;

  if (!channelId || !channelSecret || !callbackUrl) return null;
  return { channelId, channelSecret, callbackUrl };
}

export function hashOAuthState(rawState: string) {
  return crypto.createHash("sha256").update(rawState).digest("hex");
}

function createRawOAuthState() {
  return crypto.randomBytes(32).toString("base64url");
}

export async function createLineOAuthState(
  userId: string,
  redirectPath: string | null = "/dashboard"
) {
  const rawState = createRawOAuthState();
  const stateHash = hashOAuthState(rawState);
  const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS).toISOString();
  const now = new Date().toISOString();

  const admin = createSupabaseAdminClient();

  await admin
    .from("line_oauth_states")
    .update({ consumed_at: now })
    .eq("user_id", userId)
    .is("consumed_at", null);

  const { error } = await admin.from("line_oauth_states").insert({
    user_id: userId,
    state_hash: stateHash,
    redirect_path: redirectPath,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error("line_state_create_failed");
  }

  return {
    rawState,
    stateHash,
    expiresAt,
  };
}

export function buildLineLoginUrl(rawState: string) {
  const env = getLineLoginEnv();
  if (!env) throw new Error("line_env_missing");

  const url = new URL(LINE_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.channelId);
  url.searchParams.set("redirect_uri", env.callbackUrl);
  url.searchParams.set("state", rawState);
  url.searchParams.set("scope", "profile openid");
  url.searchParams.set("bot_prompt", "normal");

  return url.toString();
}

export async function consumeLineOAuthState(
  rawState: string
): Promise<LineOAuthStateRow | null> {
  const stateHash = hashOAuthState(rawState);
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("line_oauth_states")
    .update({ consumed_at: now })
    .eq("state_hash", stateHash)
    .is("consumed_at", null)
    .gt("expires_at", now)
    .select("id,user_id,state_hash,redirect_path,expires_at,consumed_at,created_at")
    .maybeSingle<LineOAuthStateRow>();

  if (error || !data) return null;
  return data;
}

export async function exchangeLineCodeForToken(code: string) {
  const env = getLineLoginEnv();
  if (!env) throw new Error("line_env_missing");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.callbackUrl,
    client_id: env.channelId,
    client_secret: env.channelSecret,
  });

  const response = await fetch(LINE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await response.json().catch(() => ({}))) as LineTokenResponse;

  if (!response.ok || !json.access_token) {
    throw new Error("line_token_exchange_failed");
  }

  return {
    accessToken: json.access_token,
  };
}

export async function fetchLineProfile(accessToken: string): Promise<LineProfile> {
  const response = await fetch(LINE_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = (await response.json().catch(() => ({}))) as Partial<LineProfile>;

  if (!response.ok || !json.userId) {
    throw new Error("line_profile_fetch_failed");
  }

  return {
    userId: json.userId,
    displayName: json.displayName,
    pictureUrl: json.pictureUrl,
  };
}
