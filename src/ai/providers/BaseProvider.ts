import type { IAIProvider, AIRequest } from '../types';

/**
 * Shared HTTP utility for all providers.
 *
 * Uses _realFetch (stashed before the mock interceptor runs) so AI calls
 * never hit the fitpulse.app route matcher in development.
 *
 * This is NOT a God class — it owns exactly one thing: making an authenticated
 * POST and deserialising the JSON response. All provider-specific logic
 * (URL, headers, body shape, response path) lives in the subclass.
 */
export abstract class BaseProvider implements IAIProvider {
  abstract readonly id: string;
  abstract readonly displayName: string;
  abstract readonly model: string;

  abstract isAvailable(): boolean;
  abstract complete(request: AIRequest): Promise<string>;

  protected getRealFetch(): typeof fetch {
    return (global as any)._realFetch ?? global.fetch;
  }

  protected async post<TResponse>(
    url: string,
    headers: Record<string, string>,
    body: unknown,
  ): Promise<TResponse> {
    let res: Response;
    try {
      res = await this.getRealFetch()(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
    } catch (networkErr: any) {
      throw new Error(`[${this.id}] Network error: ${networkErr?.message ?? 'unknown'}`);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`[${this.id}] HTTP ${res.status}: ${text}`);
    }

    return res.json() as Promise<TResponse>;
  }
}
