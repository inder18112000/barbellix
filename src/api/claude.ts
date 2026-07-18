/**
 * Direct Claude API client.
 * Requires EXPO_PUBLIC_ANTHROPIC_API_KEY in .env
 * Claude API calls to api.anthropic.com pass through the fetch mock untouched
 * (mock only intercepts https://api.fitpulse.app/v1/*).
 */
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

// Bypass the mock fetch interceptor — go straight to the real network fetch.
// The mock replaces global.fetch; we keep a reference to the real one here
// so Claude API calls never hit the fitpulse.app route matcher.
function getRealFetch(): typeof fetch {
  // @ts-ignore — _originalFetch is set by setup.ts before startMockServer runs
  return (global as any)._realFetch ?? global.fetch;
}

export async function askClaude(
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string,
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
  if (!apiKey) throw new Error('NO_KEY');

  const messages: ChatTurn[] = [
    ...history.slice(-10),
    { role: 'user', content: userMessage },
  ];

  let res: Response;
  try {
    res = await getRealFetch()(CLAUDE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt,
        messages,
      }),
    });
  } catch (networkErr: any) {
    console.error('[Claude] Network error:', networkErr);
    throw new Error(`Network error: ${networkErr?.message ?? 'unknown'}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[Claude] HTTP ${res.status}:`, body);
    throw new Error(`Claude API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';
  if (!text) console.warn('[Claude] Empty response:', JSON.stringify(data));
  return text;
}
