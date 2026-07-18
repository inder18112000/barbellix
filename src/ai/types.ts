// ─── Core AI abstractions ────────────────────────────────────────────────────
// All providers and consumers depend on these interfaces, never on each other.
// Adding a new provider never requires touching this file (OCP).

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  systemPrompt: string;
  history: AIMessage[];
  userMessage: string;
  maxTokens?: number;
}

export interface AIResponse {
  text: string;
  /** Matches IAIProvider.id */
  providerId: string;
  model: string;
}

/**
 * Contract every AI provider must satisfy.
 * Consumers depend on this interface, not on concrete classes (DIP).
 */
export interface IAIProvider {
  /** Stable identifier used in logs and UI badges */
  readonly id: string;
  /** Short human-readable name shown in the UI */
  readonly displayName: string;
  /** Model identifier sent to the API */
  readonly model: string;
  /**
   * Returns true when the provider's API key is present in the environment.
   * Called before attempting a request — prevents pointless network calls.
   */
  isAvailable(): boolean;
  /**
   * Execute a single chat completion.
   * Must throw (not return empty) on failure so the registry can try the next provider.
   */
  complete(request: AIRequest): Promise<string>;
}
