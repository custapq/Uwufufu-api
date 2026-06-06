import { describe, it, expect } from "vitest";
import { HttpClient, DEFAULT_BASE_URL } from "../src/http.js";
import { UwufufuApiError, isUwufufuApiError } from "../src/errors.js";
import { mockFetch } from "./mock.js";

describe("HttpClient", () => {
  it("builds the URL against the default base and parses JSON", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({
      status: 200,
      body: { ok: true },
    }));
    const http = new HttpClient({ fetch: fetchImpl });
    const res = await http.request<{ ok: boolean }>("GET", "/ping");
    expect(res).toEqual({ ok: true });
    expect(calls[0]?.url).toBe(`${DEFAULT_BASE_URL}/ping`);
  });

  it("injects the Authorization header when a token is set", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: {} }));
    const http = new HttpClient({ fetch: fetchImpl, token: "abc" });
    await http.request("GET", "/auth/me");
    expect(calls[0]?.headers["Authorization"]).toBe("Bearer abc");
  });

  it("omits Authorization when there is no token", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: {} }));
    const http = new HttpClient({ fetch: fetchImpl });
    await http.request("GET", "/categories");
    expect(calls[0]?.headers["Authorization"]).toBeUndefined();
  });

  it("serializes query params and drops undefined", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: {} }));
    const http = new HttpClient({ fetch: fetchImpl });
    await http.request("GET", "/games/mine", {
      query: { page: 1, limit: undefined, q: "dog" },
    });
    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("q")).toBe("dog");
    expect(url.searchParams.has("limit")).toBe(false);
  });

  it("sends a JSON body with Content-Type", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 201, body: {} }));
    const http = new HttpClient({ fetch: fetchImpl });
    await http.request("POST", "/games", { body: { title: "x" } });
    expect(calls[0]?.headers["Content-Type"]).toBe("application/json");
    expect(calls[0]?.body).toEqual({ title: "x" });
  });

  it("throws a typed UwufufuApiError with parsed body on non-2xx", async () => {
    const { fetchImpl } = mockFetch(() => ({
      status: 400,
      body: { message: ["bad"], error: "Bad Request", statusCode: 400 },
    }));
    const http = new HttpClient({ fetch: fetchImpl, maxRetries: 0 });
    const err = await http.request("POST", "/games").catch((e) => e);
    expect(isUwufufuApiError(err)).toBe(true);
    expect((err as UwufufuApiError).status).toBe(400);
    expect((err as UwufufuApiError).body?.message).toEqual(["bad"]);
    expect((err as UwufufuApiError).endpoint).toBe("POST /games");
  });

  it("flags auth and rate-limit errors", async () => {
    const { fetchImpl } = mockFetch(() => ({ status: 401, text: "" }));
    const http = new HttpClient({ fetch: fetchImpl, maxRetries: 0 });
    const err = (await http
      .request("GET", "/auth/me")
      .catch((e) => e)) as UwufufuApiError;
    expect(err.isAuthError).toBe(true);
    expect(err.isRateLimited).toBe(false);
  });

  it("retries on 429 then succeeds", async () => {
    let n = 0;
    const { fetchImpl, calls } = mockFetch(() => {
      n += 1;
      return n === 1
        ? { status: 429, text: "" }
        : { status: 200, body: { ok: true } };
    });
    const http = new HttpClient({ fetch: fetchImpl, retryBaseDelayMs: 1 });
    const res = await http.request<{ ok: boolean }>("GET", "/x");
    expect(res).toEqual({ ok: true });
    expect(calls).toHaveLength(2);
  });

  it("retries on 503 up to maxRetries then throws", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 503, text: "" }));
    const http = new HttpClient({
      fetch: fetchImpl,
      maxRetries: 2,
      retryBaseDelayMs: 1,
    });
    const err = await http.request("GET", "/x").catch((e) => e);
    expect(isUwufufuApiError(err)).toBe(true);
    expect(calls).toHaveLength(3); // initial + 2 retries
  });

  it("does not retry on 400", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({
      status: 400,
      body: { message: "no", error: "Bad Request", statusCode: 400 },
    }));
    const http = new HttpClient({ fetch: fetchImpl, retryBaseDelayMs: 1 });
    await http.request("GET", "/x").catch(() => {});
    expect(calls).toHaveLength(1);
  });

  it("returns undefined for 204 No Content", async () => {
    const { fetchImpl } = mockFetch(() => ({ status: 204 }));
    const http = new HttpClient({ fetch: fetchImpl });
    const res = await http.request("DELETE", "/x");
    expect(res).toBeUndefined();
  });

  it("strips trailing slashes from a custom baseUrl", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: {} }));
    const http = new HttpClient({
      fetch: fetchImpl,
      baseUrl: "https://example.test/v9/",
    });
    await http.request("GET", "/ping");
    expect(calls[0]?.url).toBe("https://example.test/v9/ping");
  });
});
