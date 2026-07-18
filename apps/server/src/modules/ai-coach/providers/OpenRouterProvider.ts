import { BaseProvider } from './BaseProvider.js';
import type { AIRequest } from './types.js';

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
}

export class OpenRouterProvider extends BaseProvider {
  readonly id = 'openrouter';
  readonly displayName = 'OpenRouter';
  readonly model = 'meta-llama/llama-3.1-8b-instruct:free';

  isAvailable(): boolean {
    return !!process.env.OPENROUTER_API_KEY;
  }

  async complete(request: AIRequest): Promise<string> {
    const data = await this.post<OpenRouterResponse>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://fitpulse.app',
        'X-Title': 'FitPulse AI Coach',
      },
      {
        model: this.model,
        max_tokens: request.maxTokens ?? 600,
        messages: [
          { role: 'system', content: request.systemPrompt },
          ...request.history.slice(-10),
          { role: 'user', content: request.userMessage },
        ],
      },
    );

    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error(`[${this.id}] Empty response`);
    return text;
  }
}
