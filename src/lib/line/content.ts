import "server-only";

export type LineContentDownloadResult =
  | {
      ok: true;
      buffer: Buffer;
      contentType: string;
      size: number;
    }
  | {
      ok: false;
      reason: "missing_token" | "download_failed";
      providerStatus?: number;
    };

export async function downloadLineMessageContent(
  messageId: string
): Promise<LineContentDownloadResult> {
  const accessToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;

  if (!accessToken) {
    return { ok: false, reason: "missing_token" };
  }

  const response = await fetch(
    `https://api-data.line.me/v2/bot/message/${encodeURIComponent(
      messageId
    )}/content`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return {
      ok: false,
      reason: "download_failed",
      providerStatus: response.status,
    };
  }

  const contentType = response.headers.get("content-type") || "";
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    ok: true,
    buffer,
    contentType: contentType.split(";")[0].trim().toLowerCase(),
    size: buffer.byteLength,
  };
}
