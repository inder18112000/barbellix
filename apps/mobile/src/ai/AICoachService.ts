import type { AIRequest, AIResponse } from './types';
import type { ProviderRegistry } from './ProviderRegistry';

/**
 * Orchestrates AI completion across registered providers.
 *
 * SRP: tries providers in priority order, returns first success.
 * DIP: depends on the ProviderRegistry abstraction — knows nothing about
 *      Groq, Gemini, or any concrete provider.
 *
 * To change priority: re-order registration in index.ts.
 * To add a provider: register it in index.ts — this class never changes.
 */
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
        console.log(`[AICoachService] ✅ Response from ${provider.id} (${provider.model}) — ${text.length} chars`);
        return { text, providerId: provider.id, model: provider.model };
      } catch (err: any) {
        const msg = err?.message ?? 'unknown';
        console.warn(`[AICoachService] ${provider.id} failed — ${msg}`);
        errors.push(`${provider.id}: ${msg}`);
      }
    }

    throw new Error(`All providers failed:\n${errors.join('\n')}`);
  }

  /** Convenience: which providers are currently configured. */
  getAvailableProviders() {
    return this.registry.getAvailable().map(p => ({
      id: p.id,
      displayName: p.displayName,
      model: p.model,
    }));
  }
}
