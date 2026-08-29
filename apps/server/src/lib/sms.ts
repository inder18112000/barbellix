import twilio from 'twilio';
import { AppError } from './errors.js';

export class SmsNotConfiguredError extends AppError {
  constructor() {
    super(503, 'SMS is not configured on this server');
  }
}

/**
 * SMS delivery behind a swappable backend seam, same shape as lib/storage.ts's
 * STORAGE_BACKEND=local|gcs pattern - SMS_PROVIDER picks the implementation, only 'twilio' exists
 * today. Unlike push.ts's sendPushToUser() (best-effort, swallows all errors), sendSms() throws on
 * failure: OTP delivery is security-critical, a silent failure here would leave an admin waiting
 * on a code that never arrives with no indication why.
 */

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient(): ReturnType<typeof twilio> | null {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  twilioClient = twilio(sid, token);
  return twilioClient;
}

function getClient(): ReturnType<typeof twilio> | null {
  const provider = process.env.SMS_PROVIDER ?? 'twilio';
  if (provider !== 'twilio') return null;
  return getTwilioClient();
}

export function isConfigured(): boolean {
  return getClient() !== null && !!process.env.TWILIO_FROM_NUMBER;
}

/** toE164 must be called by the caller (see lib/phone.ts) - this function assumes `to` is already
 * a valid E.164 number and does no validation of its own. */
export async function sendSms(to: string, body: string): Promise<void> {
  const client = getClient();
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!client || !from) throw new SmsNotConfiguredError();

  await client.messages.create({ to, from, body });
}
