import "server-only";

const BREVO_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_SENDER_NAME = "สาขาเทคโนโลยีสารสนเทศ";

export type BrevoSendEmailInput = {
  to: {
    email: string;
    name?: string | null;
  };
  subject: string;
  htmlContent: string;
  textContent: string;
};

export type BrevoSendEmailResult =
  | { status: "sent"; providerStatus: number }
  | { status: "skipped"; reason: "missing_env" }
  | { status: "failed"; providerStatus?: number; reason: string };

export async function sendBrevoTransactionalEmail(
  input: BrevoSendEmailInput
): Promise<BrevoSendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || DEFAULT_SENDER_NAME;

  if (!apiKey || !senderEmail) {
    return { status: "skipped", reason: "missing_env" };
  }

  try {
    const response = await fetch(BREVO_EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: senderName,
        },
        to: [
          {
            email: input.to.email,
            ...(input.to.name ? { name: input.to.name } : {}),
          },
        ],
        subject: input.subject,
        htmlContent: input.htmlContent,
        textContent: input.textContent,
      }),
    });

    if (!response.ok) {
      return {
        status: "failed",
        providerStatus: response.status,
        reason: "brevo_non_2xx_response",
      };
    }

    return { status: "sent", providerStatus: response.status };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.name : "brevo_request_failed",
    };
  }
}
