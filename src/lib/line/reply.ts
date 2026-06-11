import "server-only";

const LINE_REPLY_MESSAGE_ENDPOINT = "https://api.line.me/v2/bot/message/reply";

export type LineReplyMessageResult =
  | { status: "sent"; providerStatus: number }
  | { status: "skipped"; reason: "missing_env" }
  | { status: "failed"; providerStatus?: number; reason: string };

export async function replyLineTextMessage(
  replyToken: string,
  text: string
): Promise<LineReplyMessageResult> {
  const accessToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;

  if (!accessToken) {
    return { status: "skipped", reason: "missing_env" };
  }

  try {
    const response = await fetch(LINE_REPLY_MESSAGE_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        replyToken,
        messages: [
          {
            type: "text",
            text,
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        status: "failed",
        providerStatus: response.status,
        reason: "line_non_2xx_response",
      };
    }

    return { status: "sent", providerStatus: response.status };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.name : "line_reply_request_failed",
    };
  }
}
