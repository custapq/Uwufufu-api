import { describe, it, expect } from "vitest";
import { createClient } from "../src/index.js";
import { mockFetch } from "./mock.js";

describe("auth", () => {
  it("login posts credentials, stores the token, and returns it", async () => {
    const { fetchImpl, calls } = mockFetch((call) => {
      if (call.path === "/v1/auth/login") {
        return { status: 201, body: { accessToken: "TKN" } };
      }
      return { status: 200, body: { id: 1, name: "me" } };
    });
    const client = createClient({ fetch: fetchImpl });

    const res = await client.auth.login("a@b.com", "password123");
    expect(res.accessToken).toBe("TKN");
    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.body).toEqual({ email: "a@b.com", password: "password123" });

    // Subsequent calls are authenticated with the stored token.
    await client.auth.me();
    expect(calls[1]?.headers["Authorization"]).toBe("Bearer TKN");
  });

  it("me() calls GET /auth/me", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({
      status: 200,
      body: { id: 7, name: "u" },
    }));
    const client = createClient({ fetch: fetchImpl, token: "t" });
    const me = await client.auth.me();
    expect(me.id).toBe(7);
    expect(calls[0]?.path).toBe("/v1/auth/me");
  });

  it("setToken updates the token used for requests", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: {} }));
    const client = createClient({ fetch: fetchImpl });
    client.setToken("later");
    await client.auth.me();
    expect(calls[0]?.headers["Authorization"]).toBe("Bearer later");
  });
});
