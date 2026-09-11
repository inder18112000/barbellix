import { AppError } from './errors.js';

export class EmailNotConfiguredError extends AppError {
  constructor() {
    super(503, 'Email is not configured on this server');
  }
}

/**
 * Email delivery behind a swappable backend seam, same shape as lib/sms.ts's
 * SMS_PROVIDER=twilio pattern - EMAIL_PROVIDER picks the implementation, only 'resend' exists
 * today. Resend's API is a single plain HTTP call, so this needs no SDK dependency - just fetch
 * (global in Node 18+). Like sendSms(), sendEmail() throws on failure rather than swallowing it:
 * callers (e.g. auth/service.ts's forgotPassword) decide for themselves whether a delivery
 * failure should be surfaced or just logged.
 */

function getProvider(): string {
  return process.env.EMAIL_PROVIDER ?? 'resend';
}

export function isConfigured(): boolean {
  return getProvider() === 'resend' && !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM_ADDRESS;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const provider = getProvider();
  if (provider !== 'resend') throw new EmailNotConfiguredError();

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  if (!apiKey || !fromAddress) throw new EmailNotConfiguredError();

  const fromName = process.env.EMAIL_FROM_NAME ?? 'BarBellix';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddress}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
}
