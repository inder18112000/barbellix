import type { IAIProvider } from './types.js';

export class ProviderRegistry {
  private readonly providers: IAIProvider[] = [];

  register(provider: IAIProvider): this {
    this.providers.push(provider);
    return this;
  }

  getAvailable(): IAIProvider[] {
    return this.providers.filter((p) => p.isAvailable());
  }
}
