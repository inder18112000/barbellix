/**
 * Composition root — the only place that knows about concrete providers.
 *
 * To add a new provider:
 *   1. Create src/ai/providers/YourProvider.ts  (implements IAIProvider)
 *   2. Add EXPO_PUBLIC_YOUR_KEY to .env
 *   3. registry.register(new YourProvider())  ← one line here, nothing else changes
 *
 * Priority = registration order (first registered = first tried).
 */
import { ProviderRegistry } from './ProviderRegistry';
import { AICoachService } from './AICoachService';
import { GroqProvider } from './providers/GroqProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { ClaudeProvider } from './providers/ClaudeProvider';

const registry = new ProviderRegistry()
  .register(new GroqProvider())        // 1st — free, fast, best quality
  .register(new GeminiProvider())      // 2nd — free, very capable
  .register(new OpenRouterProvider())  // 3rd — free models
  .register(new ClaudeProvider());     // 4th — paid fallback

export const aiCoachService = new AICoachService(registry);

// Re-export types so consumers import from one place
export type { IAIProvider, AIRequest, AIResponse, AIMessage } from './types';
export { ProviderRegistry } from './ProviderRegistry';
export { AICoachService } from './AICoachService';
