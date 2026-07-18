import { BaseProvider } from './BaseProvider';
import type { AIRequest } from '../types';

// OpenRouter — FREE models (no credits needed, just an account)
// Free models: meta-llama/llama-3.1-8b-instruct:free
//              mistralai/mistral-7b-instruct:free
//              google/gemma-2-9b-it:free
// Get key: https://openrouter.ai → Keys (no credit card)
// OpenAI-compatible format

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
}

export class OpenRouterProvider extends BaseProvider {
  readonly id = 'openrouter';
  readonly displayName = 'OpenRouter';
  readonly model = 'meta-llama/llama-3.1-8b-instruct:free';

  isAvailable(): boolean {
    return !!(process.env.EXPO_PUBLIC_OPENROUTER_API_KEY);
  }

  async complete(request: AIRequest): Promise<string> {
    const data = await this.post<OpenRouterResponse>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`,
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
