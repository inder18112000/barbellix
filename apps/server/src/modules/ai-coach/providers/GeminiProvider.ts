import { BaseProvider } from './BaseProvider.js';
import type { AIRequest, AIMessage } from './types.js';

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> };
  }>;
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export class GeminiProvider extends BaseProvider {
  readonly id = 'gemini';
  readonly displayName = 'Gemini';
  readonly model = 'gemini-1.5-flash';

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async complete(request: AIRequest): Promise<string> {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`;

    const contents: GeminiMessage[] = [
      ...request.history.slice(-10).map((m: AIMessage) => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: m.content }],
      })),
      { role: 'user' as const, parts: [{ text: request.userMessage }] },
    ];

    const data = await this.post<GeminiResponse>(
      url,
      {},
      {
        systemInstruction: { parts: [{ text: request.systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: request.maxTokens ?? 600, temperature: 0.7 },
      },
    );

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) throw new Error(`[${this.id}] Empty response`);
    return text;
  }
}
