import type { IAIProvider, AIRequest } from './types.js';

/**
 * Shared HTTP utility for all providers - owns exactly one thing: making an
 * authenticated POST and deserialising the JSON response. All provider-specific
 * logic (URL, headers, body shape, response path) lives in the subclass.
 *
 * Ported from the client's src/ai/providers/BaseProvider.ts - the only real
 * change is dropping the _realFetch mock-bypass trick, which only existed to
 * dodge the RN client's mocked global.fetch. Node's native fetch needs no such
 * workaround.
 */
export abstract class BaseProvider implements IAIProvider {
  abstract readonly id: string;
  abstract readonly displayName: string;
  abstract readonly model: string;

  abstract isAvailable(): boolean;
  abstract complete(request: AIRequest): Promise<string>;

  protected async post<TResponse>(
    url: string,
    headers: Record<string, string>,
    body: unknown,
  ): Promise<TResponse> {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      const message = networkErr instanceof Error ? networkErr.message : 'unknown';
      throw new Error(`[${this.id}] Network error: ${message}`);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`[${this.id}] HTTP ${res.status}: ${text}`);
    }

    return res.json() as Promise<TResponse>;
  }
}
