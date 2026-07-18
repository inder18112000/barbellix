/**
 * Multi-provider AI chat client — tries free providers in priority order.
 *
 * Priority:
 *   1. Groq  (FREE — 14,400 req/day, Llama 3.3 70B)   EXPO_PUBLIC_GROQ_API_KEY
 *   2. Gemini (FREE — 1,500 req/day, Gemini 1.5 Flash) EXPO_PUBLIC_GEMINI_API_KEY
 *   3. OpenRouter (FREE models available)               EXPO_PUBLIC_OPENROUTER_API_KEY
 *   4. Claude (paid — fallback if you have credits)     EXPO_PUBLIC_ANTHROPIC_API_KEY
 *
 * All calls bypass the fitpulse mock-fetch interceptor via _realFetch.
 */

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

function getRealFetch(): typeof fetch {
  return (global as any)._realFetch ?? global.fetch;
}

// ─── Groq ─────────────────────────────────────────────────────────────────────
// Free: 14,400 req/day · 6,000 tokens/min · no credit card
// Sign up: https://console.groq.com  →  API Keys
// OpenAI-compatible format, blazing fast (Llama on custom hardware)

async function askGroq(system: string, history: ChatTurn[], message: string): Promise<string> {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
  if (!key) throw new Error('NO_KEY:groq');

  const res = await getRealFetch()('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      messages: [
        { role: 'system', content: system },
        ...history.slice(-10),
        { role: 'user', content: message },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text().catch(() => '')}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Google Gemini ────────────────────────────────────────────────────────────
// Free: 1,500 req/day · 15 RPM · 1M tokens/min · no credit card
// Sign up: https://aistudio.google.com/app/apikey
// Note: Gemini uses its own message format (role: "model" not "assistant")

async function askGemini(system: string, history: ChatTurn[], message: string): Promise<string> {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  if (!key) throw new Error('NO_KEY:gemini');

  // Convert history to Gemini format (assistant → model)
  const contents = [
    ...history.slice(-10).map(t => ({
      role: t.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: t.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const res = await getRealFetch()(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 600 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text().catch(() => '')}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ─── OpenRouter ───────────────────────────────────────────────────────────────
// Free models (no credits needed): meta-llama/llama-3.1-8b-instruct:free
//                                   mistralai/mistral-7b-instruct:free
// Sign up: https://openrouter.ai  →  Keys
// OpenAI-compatible format

async function askOpenRouter(system: string, history: ChatTurn[], message: string): Promise<string> {
  const key = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '';
  if (!key) throw new Error('NO_KEY:openrouter');

  const res = await getRealFetch()('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': 'https://fitpulse.app',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      max_tokens: 600,
      messages: [
        { role: 'system', content: system },
        ...history.slice(-10),
        { role: 'user', content: message },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text().catch(() => '')}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Claude (paid fallback) ───────────────────────────────────────────────────

async function askClaude(system: string, history: ChatTurn[], message: string): Promise<string> {
  const key = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
  if (!key) throw new Error('NO_KEY:claude');

  const res = await getRealFetch()('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system,
      messages: [...history.slice(-10), { role: 'user', content: message }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text().catch(() => '')}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// ─── Main export — tries providers in order ───────────────────────────────────

export type AIProvider = 'groq' | 'gemini' | 'openrouter' | 'claude';

export async function askAI(
  system: string,
  history: ChatTurn[],
  message: string,
): Promise<{ text: string; provider: AIProvider }> {
  const providers: Array<{ id: AIProvider; fn: typeof askGroq }> = [
    { id: 'groq',        fn: askGroq },
    { id: 'gemini',      fn: askGemini },
    { id: 'openrouter',  fn: askOpenRouter },
    { id: 'claude',      fn: askClaude },
  ];

  const errors: string[] = [];
  for (const { id, fn } of providers) {
    try {
      const text = await fn(system, history, message);
      if (text) {
        console.log(`[AI] answered via ${id}`);
        return { text, provider: id };
      }
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.startsWith('NO_KEY:')) {
        // Key not configured — silently skip this provider
        continue;
      }
      console.warn(`[AI] ${id} failed:`, msg);
      errors.push(`${id}: ${msg}`);
    }
  }

  throw new Error(errors.length ? errors.join(' | ') : 'NO_KEY:all');
}
