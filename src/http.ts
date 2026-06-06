import type { ApiErrorBody } from "./types.js";
import { UwufufuApiError } from "./errors.js";

export const DEFAULT_BASE_URL = "https://api.uwufufu.com/v1";

/** Configuration for the HTTP layer / client. */
export interface ClientConfig {
  /**
   * Access token from `POST /auth/login` (the `accessToken` cookie in-browser).
   * Sent as `Authorization: Bearer <token>`. Optional for public endpoints.
   */
  token?: string;
  /** Override the base URL. Defaults to {@link DEFAULT_BASE_URL}. */
  baseUrl?: string;
  /** Inject a custom fetch (e.g. for tests). Defaults to global `fetch`. */
  fetch?: typeof fetch;
  /** Retries for 429/5xx responses. Default 2. */
  maxRetries?: number;
  /** Base delay (ms) for exponential backoff. Default 500. */
  retryBaseDelayMs?: number;
}

/** Per-request options. */
export interface RequestOptions {
  /** Query params; `undefined` values are dropped. */
  query?: Record<string, string | number | boolean | undefined>;
  /** JSON request body. */
  body?: unknown;
  /** Extra headers (merged over defaults). */
  headers?: Record<string, string>;
  /** Abort signal. */
  signal?: AbortSignal;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

/**
 * Thin, dependency-free HTTP layer over `fetch`: auth injection, JSON
 * encoding/decoding, typed errors, and backoff retries.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private token: string | undefined;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.fetchImpl = config.fetch ?? globalThis.fetch;
    this.maxRetries = config.maxRetries ?? 2;
    this.retryBaseDelayMs = config.retryBaseDelayMs ?? 500;
    this.token = config.token;

    if (typeof this.fetchImpl !== "function") {
      throw new Error(
        "No fetch implementation available. Use Node 18+ or pass `fetch` in the config.",
      );
    }
  }

  /** Replace the access token (e.g. after logging in). */
  setToken(token: string | undefined): void {
    this.token = token;
  }

  async request<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const endpoint = `${method} ${path}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...options.headers,
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    let bodyInit: string | undefined;
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      bodyInit = JSON.stringify(options.body);
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      let res: Response;
      try {
        res = await this.fetchImpl(url, {
          method,
          headers,
          body: bodyInit,
          signal: options.signal,
        });
      } catch (err) {
        // Network error — retry if attempts remain.
        lastError = err;
        if (attempt < this.maxRetries) {
          await this.sleep(this.backoffDelay(attempt), options.signal);
          continue;
        }
        throw err;
      }

      if (res.ok) {
        return (await this.parseBody(res)) as T;
      }

      if (RETRYABLE_STATUSES.has(res.status) && attempt < this.maxRetries) {
        const retryAfter = this.retryAfterMs(res);
        await this.sleep(retryAfter ?? this.backoffDelay(attempt), options.signal);
        continue;
      }

      throw await this.toApiError(res, endpoint);
    }

    // Exhausted retries on a network error.
    throw lastError;
  }

  private buildUrl(
    path: string,
    query?: RequestOptions["query"],
  ): string {
    const url = new URL(
      this.baseUrl + (path.startsWith("/") ? path : `/${path}`),
    );
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async parseBody(res: Response): Promise<unknown> {
    if (res.status === 204) return undefined;
    const text = await res.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private async toApiError(
    res: Response,
    endpoint: string,
  ): Promise<UwufufuApiError> {
    const text = await res.text();
    let body: ApiErrorBody | undefined;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && "statusCode" in parsed) {
        body = parsed as ApiErrorBody;
      }
    } catch {
      // non-JSON error body
    }
    return new UwufufuApiError(res.status, endpoint, body, text);
  }

  private retryAfterMs(res: Response): number | undefined {
    const header = res.headers.get("retry-after");
    if (!header) return undefined;
    const seconds = Number(header);
    if (!Number.isNaN(seconds)) return seconds * 1000;
    const date = Date.parse(header);
    if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
    return undefined;
  }

  private backoffDelay(attempt: number): number {
    // Exponential backoff with jitter.
    const base = this.retryBaseDelayMs * 2 ** attempt;
    return base + Math.random() * this.retryBaseDelayMs;
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(timer);
        reject(signal?.reason);
      };
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
}
