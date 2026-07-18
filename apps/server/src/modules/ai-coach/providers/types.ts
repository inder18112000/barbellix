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
  providerId: string;
  model: string;
}

export interface IAIProvider {
  readonly id: string;
  readonly displayName: string;
  readonly model: string;
  isAvailable(): boolean;
  complete(request: AIRequest): Promise<string>;
}
