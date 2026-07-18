import { BaseProvider } from './BaseProvider.js';
import type { AIRequest } from './types.js';

interface ClaudeResponse {
  content: Array<{ type: 'text'; text: string }>;
}

export class ClaudeProvider extends BaseProvider {
  readonly id = 'claude';
  readonly displayName = 'Claude';
  readonly model = 'claude-haiku-4-5-20251001';

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async complete(request: AIRequest): Promise<string> {
    const data = await this.post<ClaudeResponse>(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      {
        model: this.model,
        max_tokens: request.maxTokens ?? 600,
        system: request.systemPrompt,
        messages: [...request.history.slice(-10), { role: 'user', content: request.userMessage }],
      },
    );

    const text = data.content?.[0]?.text ?? '';
    if (!text) throw new Error(`[${this.id}] Empty response`);
    return text;
  }
}
