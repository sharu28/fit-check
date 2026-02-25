const RESEND_API_URL = 'https://api.resend.com/emails';

export type SendEmailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
};

type ResendSuccessResponse = {
  id: string;
};

type ResendErrorResponse = {
  statusCode?: number;
  name?: string;
  message?: string;
};

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function sendEmailWithResend(input: SendEmailInput): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY');
  }

  if (!from) {
    throw new Error('Missing RESEND_FROM_EMAIL');
  }

  if (!input.html && !input.text) {
    throw new Error('Email must include html or text content');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
    }),
  });

  if (!response.ok) {
    let details = '';
    try {
      const body = (await response.json()) as ResendErrorResponse;
      details = body.message ? `: ${body.message}` : '';
    } catch {
      // Ignore parse failures and use status text fallback below.
    }
    throw new Error(`Resend request failed (${response.status}${details || `: ${response.statusText}`})`);
  }

  const data = (await response.json()) as ResendSuccessResponse;
  if (!data.id) {
    throw new Error('Resend response missing email id');
  }

  return data.id;
}
