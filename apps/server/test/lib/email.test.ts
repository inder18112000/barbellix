import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

// lib/email.ts reads process.env directly on every call (no module-level cache, unlike
// lib/cashfree.ts) so a plain top-level import is fine here - no vi.resetModules() dance needed.
const { isConfigured, sendEmail, EmailNotConfiguredError } = await import('../../src/lib/email.js');

describe('lib/email.ts', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('isConfigured() is false when RESEND_API_KEY / EMAIL_FROM_ADDRESS are absent', () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM_ADDRESS;

    expect(isConfigured()).toBe(false);
  });

  it('isConfigured() is true once both are set', () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.EMAIL_FROM_ADDRESS = 'no-reply@example.com';

    expect(isConfigured()).toBe(true);
  });

  it('isConfigured() is false for a non-resend EMAIL_PROVIDER', () => {
    process.env.EMAIL_PROVIDER = 'ses';
    process.env.RESEND_API_KEY = 'test-key';
    process.env.EMAIL_FROM_ADDRESS = 'no-reply@example.com';

    expect(isConfigured()).toBe(false);
  });

  it('sendEmail() throws EmailNotConfiguredError when unconfigured, without calling fetch', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM_ADDRESS;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      sendEmail({ to: 'member@example.com', subject: 'Subject', html: '<p>hi</p>', text: 'hi' }),
    ).rejects.toThrow(EmailNotConfiguredError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sendEmail() POSTs to the Resend API with the configured from address when configured', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.EMAIL_FROM_ADDRESS = 'no-reply@example.com';
    process.env.EMAIL_FROM_NAME = 'BarBellix';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

    await sendEmail({ to: 'member@example.com', subject: 'Subject', html: '<p>hi</p>', text: 'hi' });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
    const body = JSON.parse((fetchSpy.mock.calls[0]![1] as RequestInit).body as string);
    expect(body).toMatchObject({
      from: 'BarBellix <no-reply@example.com>',
      to: 'member@example.com',
      subject: 'Subject',
    });
  });

  it('sendEmail() throws when the Resend API responds with a non-2xx status', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.EMAIL_FROM_ADDRESS = 'no-reply@example.com';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('bad request', { status: 400 }));

    await expect(
      sendEmail({ to: 'member@example.com', subject: 'Subject', html: '<p>hi</p>', text: 'hi' }),
    ).rejects.toThrow(/Resend API error/);
  });
});
