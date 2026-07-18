import { ProviderRegistry } from './ProviderRegistry.js';
import { AICoachService } from './AICoachService.js';
import { GroqProvider } from './GroqProvider.js';
import { GeminiProvider } from './GeminiProvider.js';
import { OpenRouterProvider } from './OpenRouterProvider.js';
import { ClaudeProvider } from './ClaudeProvider.js';

// Priority order: fastest/free-tier-friendliest first, paid fallback last.
const registry = new ProviderRegistry()
  .register(new GroqProvider())
  .register(new GeminiProvider())
  .register(new OpenRouterProvider())
  .register(new ClaudeProvider());

export const aiCoachService = new AICoachService(registry);
export type { AIRequest, AIResponse, AIMessage } from './types.js';
