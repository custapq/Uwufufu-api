/** Tiny mock-fetch helper for tests: records calls and serves scripted responses. */

export interface RecordedCall {
  url: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface MockResponse {
  status: number;
  body?: unknown;
  /** Raw text body (overrides `body`). */
  text?: string;
  headers?: Record<string, string>;
}

export function mockFetch(
  handler: (call: RecordedCall) => MockResponse,
): { fetchImpl: typeof fetch; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fetchImpl = (async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    const call: RecordedCall = {
      url,
      path: new URL(url).pathname,
      method: (init?.method ?? "GET").toUpperCase(),
      headers: (init?.headers as Record<string, string>) ?? {},
      body: init?.body ? JSON.parse(init.body as string) : null,
    };
    calls.push(call);
    const r = handler(call);
    // 204/205/304 must have a null body per the Response/fetch spec.
    const nullBody = r.status === 204 || r.status === 205 || r.status === 304;
    const payload = nullBody
      ? null
      : r.text !== undefined
        ? r.text
        : r.body !== undefined
          ? JSON.stringify(r.body)
          : "";
    return new Response(payload, { status: r.status, headers: r.headers });
  }) as typeof fetch;
  return { fetchImpl, calls };
}
