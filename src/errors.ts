import type { ApiErrorBody } from "./types.js";

/**
 * Thrown when the uwufufu API returns a non-2xx response. Carries the HTTP
 * status and the parsed error body (when the response was JSON).
 */
export class UwufufuApiError extends Error {
  /** HTTP status code. */
  readonly status: number;
  /** Request method + path, for context. */
  readonly endpoint: string;
  /** Parsed error body, when available. */
  readonly body: ApiErrorBody | undefined;

  constructor(
    status: number,
    endpoint: string,
    body: ApiErrorBody | undefined,
    rawText: string,
  ) {
    super(UwufufuApiError.formatMessage(status, endpoint, body, rawText));
    this.name = "UwufufuApiError";
    this.status = status;
    this.endpoint = endpoint;
    this.body = body;
  }

  /** True for 401/403. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** True for 429. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  private static formatMessage(
    status: number,
    endpoint: string,
    body: ApiErrorBody | undefined,
    rawText: string,
  ): string {
    const detail = body
      ? Array.isArray(body.message)
        ? body.message.join("; ")
        : body.message
      : rawText.slice(0, 200);
    return `uwufufu API ${status} on ${endpoint}${detail ? `: ${detail}` : ""}`;
  }
}

/** Type guard for {@link UwufufuApiError}. */
export function isUwufufuApiError(err: unknown): err is UwufufuApiError {
  return err instanceof UwufufuApiError;
}
