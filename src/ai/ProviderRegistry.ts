import type { IAIProvider } from './types';

/**
 * Ordered list of AI providers.
 *
 * SRP: this class does one thing — maintain the ordered list and filter
 * to available providers.
 *
 * OCP: callers add new providers via register() without modifying this class.
 *
 * Usage:
 *   registry.register(new GroqProvider());   // highest priority
 *   registry.register(new GeminiProvider()); // second
 *   registry.getAvailable()                  // returns configured ones in order
 */
export class ProviderRegistry {
  private readonly providers: IAIProvider[] = [];

  register(provider: IAIProvider): this {
    this.providers.push(provider);
    return this; // fluent API for chaining
  }

  /** Returns all providers whose isAvailable() returns true, in registration order. */
  getAvailable(): IAIProvider[] {
    return this.providers.filter(p => p.isAvailable());
  }

  /** Look up a specific provider by its id. */
  getById(id: string): IAIProvider | undefined {
    return this.providers.find(p => p.id === id);
  }

  /** All registered providers, regardless of availability. */
  getAll(): IAIProvider[] {
    return [...this.providers];
  }
}
