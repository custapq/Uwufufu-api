import { describe, it, expect } from "vitest";
import { createClient } from "../src/index.js";
import { mockFetch } from "./mock.js";

describe("selections", () => {
  it("addVideo maps url -> resourceUrl and posts to /selections/video", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({
      status: 201,
      body: { id: 5, gameId: 999, name: "Song", isVideo: true },
    }));
    const client = createClient({ fetch: fetchImpl, token: "t" });
    const sel = await client.selections.addVideo({
      worldcupId: 999,
      url: "https://www.youtube.com/watch?v=abc",
      startTime: 0,
      endTime: 30,
    });
    expect(sel.id).toBe(5);
    expect(calls[0]?.path).toBe("/v1/selections/video");
    expect(calls[0]?.body).toEqual({
      worldcupId: 999,
      resourceUrl: "https://www.youtube.com/watch?v=abc",
      startTime: 0,
      endTime: 30,
    });
  });

  it("defaults startTime/endTime to 0", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 201, body: {} }));
    const client = createClient({ fetch: fetchImpl, token: "t" });
    await client.selections.addVideo({
      worldcupId: 1,
      url: "https://youtu.be/abc",
    });
    expect(calls[0]?.body).toMatchObject({ startTime: 0, endTime: 0 });
  });
});
