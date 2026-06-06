import { describe, it, expect } from "vitest";
import { createClient } from "../src/index.js";
import { mockFetch } from "./mock.js";

const draft = {
  id: 999,
  title: "T",
  description: "D",
  visibility: "IS_CLOSED",
  coverImage: null,
  slug: "t-x",
  isNsfw: false,
  locale: null,
  category: { id: 1, name: "Cat" },
};

describe("games", () => {
  it("create applies IS_CLOSED + isNsfw defaults", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 201, body: draft }));
    const client = createClient({ fetch: fetchImpl, token: "t" });
    await client.games.create({
      title: "T",
      description: "D",
      categoryId: 16,
    });
    expect(calls[0]?.path).toBe("/v1/games");
    expect(calls[0]?.body).toEqual({
      title: "T",
      description: "D",
      categoryId: 16,
      isNsfw: false,
      visibility: "IS_CLOSED",
    });
  });

  it("listMine passes pagination params", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({
      status: 200,
      body: { page: 2, perPage: 5, total: 0, worldcups: [] },
    }));
    const client = createClient({ fetch: fetchImpl, token: "t" });
    const page = await client.games.listMine({ page: 2, limit: 5 });
    expect(page.page).toBe(2);
    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("update reads current then PUTs a merged full body", async () => {
    const { fetchImpl, calls } = mockFetch((call) => {
      if (call.method === "GET") return { status: 200, body: draft };
      return { status: 200, body: { ...draft, title: "New" } };
    });
    const client = createClient({ fetch: fetchImpl, token: "t" });
    await client.games.update(999, { title: "New" });

    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.path).toBe("/v1/games/999/mine");
    expect(calls[1]?.method).toBe("PUT");
    // Merged body keeps description, maps category.id -> categoryId, overrides title.
    expect(calls[1]?.body).toMatchObject({
      id: 999,
      title: "New",
      description: "D",
      categoryId: 1,
      slug: "t-x",
    });
  });

  it("publish sets IS_PUBLIC and applies category/locale overrides", async () => {
    const { fetchImpl, calls } = mockFetch((call) => {
      if (call.method === "GET") return { status: 200, body: draft };
      return { status: 200, body: { ...draft, visibility: "IS_PUBLIC" } };
    });
    const client = createClient({ fetch: fetchImpl, token: "t" });
    const result = await client.games.publish(999, {
      categoryId: 16,
      locale: "en",
    });

    expect(result.visibility).toBe("IS_PUBLIC");
    const put = calls.find((c) => c.method === "PUT");
    expect(put?.body).toMatchObject({
      id: 999,
      visibility: "IS_PUBLIC",
      categoryId: 16,
      locale: "en",
      title: "T",
      description: "D",
    });
  });

  it("replace sends the body verbatim with the id", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: draft }));
    const client = createClient({ fetch: fetchImpl, token: "t" });
    await client.games.replace(999, { title: "Only" });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe("PUT");
    expect(calls[0]?.body).toEqual({ id: 999, title: "Only" });
  });
});
