/** Minimal injectable fetch so providers are unit-testable without network. */
export type FetchLike = typeof fetch;

export interface BaseProviderConfig {
  apiKey: string;
  model: string;
  /** Override for tests; defaults to global fetch. */
  fetchImpl?: FetchLike;
}

export async function postJson(
  fetchImpl: FetchLike,
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<unknown> {
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} from ${new URL(url).host}: ${text.slice(0, 300)}`);
  }
  return res.json();
}
