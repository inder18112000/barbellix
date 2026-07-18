import type { AIRequest, AIResponse } from './types.js';
import type { ProviderRegistry } from './ProviderRegistry.js';

export class AICoachService {
  constructor(private readonly registry: ProviderRegistry) {}

  async complete(request: AIRequest): Promise<AIResponse> {
    const available = this.registry.getAvailable();

    if (available.length === 0) {
      throw new Error('NO_PROVIDERS_CONFIGURED');
    }

    const errors: string[] = [];

    for (const provider of available) {
      try {
        const text = await provider.complete(request);
        return { text, providerId: provider.id, model: provider.model };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        errors.push(`${provider.id}: ${msg}`);
      }
    }

    throw new Error(`All providers failed:\n${errors.join('\n')}`);
  }
}
