import { describe, it, expect } from "vitest";
import { createClient } from "../src/index.js";

/**
 * Live smoke test against the real api.uwufufu.com. Skipped unless a token is
 * provided, so the default `npm test` run stays offline and deterministic.
 *
 *   UWUFUFU_TOKEN=... npm test
 */
const token = process.env.UWUFUFU_TOKEN;

describe.skipIf(!token)("integration (live)", () => {
  it("auth.me returns the current user", async () => {
    const client = createClient({ token });
    const me = await client.auth.me();
    expect(typeof me.id).toBe("number");
    expect(typeof me.email).toBe("string");
  });

  it("games.listMine returns a page", async () => {
    const client = createClient({ token });
    const page = await client.games.listMine({ page: 1, limit: 1 });
    expect(Array.isArray(page.worldcups)).toBe(true);
    expect(typeof page.total).toBe("number");
  });
});
