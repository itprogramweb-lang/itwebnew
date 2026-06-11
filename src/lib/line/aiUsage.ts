import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const DEFAULT_DAILY_LIMIT = 10;

type AiUsageLimitResult =
  | { status: "allowed"; remaining: number | null }
  | { status: "limited"; limit: number }
  | { status: "unavailable"; reason: "table_unavailable" };

function getDailyLimit() {
  const raw = process.env.AI_NEWS_DAILY_LIMIT_PER_USER;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_DAILY_LIMIT;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_LIMIT;
}

function todayStartIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function isMissingTableError(error: { code?: string } | null) {
  return error?.code === "42P01";
}

export async function checkLineNewsAiDailyLimit(
  userId: string
): Promise<AiUsageLimitResult> {
  const limit = getDailyLimit();
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("line_ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("provider", "gemini")
    .eq("purpose", "line_news_draft")
    .gte("created_at", todayStartIso());

  if (error) {
    if (isMissingTableError(error)) {
      return { status: "unavailable", reason: "table_unavailable" };
    }

    console.warn("LINE AI usage limit check failed", {
      reason: error.code || "unknown_error",
    });
    return { status: "unavailable", reason: "table_unavailable" };
  }

  const used = count ?? 0;
  if (used >= limit) {
    return { status: "limited", limit };
  }

  return { status: "allowed", remaining: limit - used };
}

export async function logLineNewsAiUsage(input: {
  userId: string;
  lineUserId: string;
}) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("line_ai_usage_logs").insert({
    user_id: input.userId,
    line_user_id: input.lineUserId,
    provider: "gemini",
    purpose: "line_news_draft",
  });

  if (error && !isMissingTableError(error)) {
    console.warn("LINE AI usage log failed", {
      reason: error.code || "unknown_error",
    });
  }
}
