import { describe, it, expect } from "vitest";
import { createClient } from "../src/index.js";
import { mockFetch } from "./mock.js";

describe("games — browse & delete", () => {
  it("browse GETs /games with no params", async () => {
    const page = { page: 1, perPage: 10, total: 0, worldcups: [] };
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: page }));
    const client = createClient({ fetch: fetchImpl });

    await client.games.browse();

    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.path).toBe("/v1/games");
    const url = new URL(calls[0]!.url);
    expect(url.searchParams.has("page")).toBe(false);
  });

  it("browse passes search/perPage/sortBy/includeNsfw", async () => {
    const page = { page: 1, perPage: 20, total: 5, worldcups: [] };
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: page }));
    const client = createClient({ fetch: fetchImpl });

    await client.games.browse({ search: "kpop", perPage: 20, sortBy: "plays", includeNsfw: false });

    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get("search")).toBe("kpop");
    expect(url.searchParams.get("perPage")).toBe("20");
    expect(url.searchParams.get("sortBy")).toBe("plays");
    expect(url.searchParams.get("includeNsfw")).toBe("false");
  });

  it("delete sends DELETE /games/:id", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: {} }));
    const client = createClient({ fetch: fetchImpl, token: "t" });

    await client.games.delete(999);

    expect(calls[0]?.method).toBe("DELETE");
    expect(calls[0]?.path).toBe("/v1/games/999");
  });
});
