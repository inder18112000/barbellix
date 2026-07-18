import { BaseProvider } from './BaseProvider';
import type { AIRequest } from '../types';

// Groq — FREE tier: 14,400 req/day, 6,000 tokens/min, no credit card
// Get key: https://console.groq.com → API Keys
// OpenAI-compatible format; Llama 3.3 70B is GPT-4-class quality

interface GroqResponse {
  choices: Array<{ message: { content: string } }>;
}

export class GroqProvider extends BaseProvider {
  readonly id = 'groq';
  readonly displayName = 'Groq';
  readonly model = 'llama-3.3-70b-versatile';

  isAvailable(): boolean {
    return !!(process.env.EXPO_PUBLIC_GROQ_API_KEY);
  }

  async complete(request: AIRequest): Promise<string> {
    const data = await this.post<GroqResponse>(
      'https://api.groq.com/openai/v1/chat/completions',
      { Authorization: `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}` },
      {
        model: this.model,
        max_tokens: request.maxTokens ?? 600,
        temperature: 0.7,
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
