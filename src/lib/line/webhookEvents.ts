import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { LineWebhookEvent } from "@/lib/line/webhook";

type WebhookEventRecordResult =
  | { status: "recorded" }
  | { status: "duplicate" }
  | { status: "skipped"; reason: "missing_identifier" | "table_unavailable" };

function isDuplicateError(error: { code?: string; message?: string } | null) {
  return error?.code === "23505";
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  return error?.code === "42P01";
}

export async function recordLineWebhookEvent(
  event: LineWebhookEvent
): Promise<WebhookEventRecordResult> {
  const lineEventId = event.webhookEventId?.trim() || null;
  const lineMessageId = event.message?.id?.trim() || null;

  if (!lineEventId && !lineMessageId) {
    return { status: "skipped", reason: "missing_identifier" };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("line_webhook_events").insert({
    line_event_id: lineEventId,
    line_message_id: lineMessageId,
    line_user_id: event.source?.userId || null,
    event_type: event.type || null,
    message_type: event.message?.type || null,
  });

  if (!error) {
    return { status: "recorded" };
  }

  if (isDuplicateError(error)) {
    return { status: "duplicate" };
  }

  if (isMissingTableError(error)) {
    return { status: "skipped", reason: "table_unavailable" };
  }

  console.warn("LINE webhook event dedupe unavailable", {
    reason: error.code || "unknown_error",
  });
  return { status: "skipped", reason: "table_unavailable" };
}
