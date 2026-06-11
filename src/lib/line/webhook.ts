import "server-only";

import crypto from "node:crypto";

export type LineWebhookEvent = {
  type?: string;
  webhookEventId?: string;
  replyToken?: string;
  source?: {
    type?: string;
    userId?: string;
  };
  message?: {
    type?: string;
    text?: string;
    id?: string;
  };
};

export type LineWebhookPayload = {
  destination?: string;
  events?: LineWebhookEvent[];
};

function safeBase64ToBuffer(value: string) {
  try {
    return Buffer.from(value, "base64");
  } catch {
    return null;
  }
}

export function verifyLineSignature(rawBody: string, signature: string | null) {
  const channelSecret = process.env.LINE_MESSAGING_CHANNEL_SECRET;

  if (!channelSecret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", channelSecret)
    .update(rawBody)
    .digest();
  const actual = safeBase64ToBuffer(signature);

  if (!actual || actual.length !== expected.length) return false;

  return crypto.timingSafeEqual(actual, expected);
}

export function parseLineWebhookPayload(rawBody: string): LineWebhookPayload {
  const parsed = JSON.parse(rawBody) as unknown;

  if (!parsed || typeof parsed !== "object") return { events: [] };

  const payload = parsed as LineWebhookPayload;
  return {
    ...payload,
    events: Array.isArray(payload.events) ? payload.events : [],
  };
}
