import { describe, it, expect } from "vitest";
import { createClient } from "../src/index.js";
import { mockFetch } from "./mock.js";

const selectionPage = { page: 1, perPage: 10, total: 2, data: [] };

describe("selections — list, listMine & delete", () => {
  it("list GETs /selections with worldcupId", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: selectionPage }));
    const client = createClient({ fetch: fetchImpl });

    await client.selections.list({ worldcupId: 123 });

    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.path).toBe("/v1/selections");
    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get("worldcupId")).toBe("123");
  });

  it("list passes optional sort/pagination params", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: selectionPage }));
    const client = createClient({ fetch: fetchImpl });

    await client.selections.list({ worldcupId: 1, page: 2, perPage: 5, sortBy: "winLossRatio", keyword: "idol" });

    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("perPage")).toBe("5");
    expect(url.searchParams.get("sortBy")).toBe("winLossRatio");
    expect(url.searchParams.get("keyword")).toBe("idol");
  });

  it("listMine GETs /selections/mine with worldcupId", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: selectionPage }));
    const client = createClient({ fetch: fetchImpl, token: "t" });

    await client.selections.listMine({ worldcupId: 456 });

    expect(calls[0]?.path).toBe("/v1/selections/mine");
    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get("worldcupId")).toBe("456");
  });

  it("delete sends DELETE /selections/:id", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: {} }));
    const client = createClient({ fetch: fetchImpl, token: "t" });

    await client.selections.delete(77);

    expect(calls[0]?.method).toBe("DELETE");
    expect(calls[0]?.path).toBe("/v1/selections/77");
  });
});
