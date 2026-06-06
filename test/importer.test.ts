import { describe, it, expect } from "vitest";
import { createClient, importTracks, type TrackEntry } from "../src/index.js";
import { mockFetch } from "./mock.js";

const draft = {
  id: 500,
  title: "T",
  description: "D",
  visibility: "IS_CLOSED",
  coverImage: null,
  slug: "t-x",
  isNsfw: false,
  locale: null,
};

function selectionRoute(name = "Song") {
  return { status: 201, body: { id: Math.random(), name, isVideo: true } };
}

describe("importTracks", () => {
  it("creates a worldcup and adds all tracks, setting the flag", async () => {
    const { fetchImpl, calls } = mockFetch((c) => {
      if (c.path === "/v1/games" && c.method === "POST")
        return { status: 201, body: draft };
      if (c.path === "/v1/selections/video") return selectionRoute();
      return { status: 404, body: {} };
    });
    const client = createClient({ fetch: fetchImpl, token: "t" });
    const tracks: TrackEntry[] = [
      { url: "https://youtu.be/a" },
      { url: "https://youtu.be/b" },
    ];

    const result = await importTracks(client, {
      tracks,
      create: { title: "T", description: "D", categoryId: 16 },
    });

    expect(result.created).toBe(true);
    expect(result.gameId).toBe(500);
    expect(result.added).toBe(2);
    expect(result.skipped).toBe(0);
    expect(tracks.every((t) => t.added_to_uwufufu === true)).toBe(true);
    // worldcupId on selection calls points at the created game
    const sel = calls.filter((c) => c.path === "/v1/selections/video");
    expect(sel).toHaveLength(2);
    expect(sel[0]?.body).toMatchObject({ worldcupId: 500, resourceUrl: "https://youtu.be/a" });
  });

  it("appends to an existing game id (no create call)", async () => {
    const { fetchImpl, calls } = mockFetch(() => selectionRoute());
    const client = createClient({ fetch: fetchImpl, token: "t" });
    const tracks: TrackEntry[] = [{ url: "https://youtu.be/a" }];

    const result = await importTracks(client, { tracks, gameId: 777 });

    expect(result.created).toBe(false);
    expect(result.gameId).toBe(777);
    expect(calls.some((c) => c.path === "/v1/games" && c.method === "POST")).toBe(false);
    expect(calls[0]?.body).toMatchObject({ worldcupId: 777 });
  });

  it("skips tracks already marked added_to_uwufufu", async () => {
    const { fetchImpl, calls } = mockFetch(() => selectionRoute());
    const client = createClient({ fetch: fetchImpl, token: "t" });
    const tracks: TrackEntry[] = [
      { url: "https://youtu.be/a", added_to_uwufufu: true },
      { url: "https://youtu.be/b" },
    ];

    const result = await importTracks(client, { tracks, gameId: 1 });

    expect(result.skipped).toBe(1);
    expect(result.added).toBe(1);
    expect(calls).toHaveLength(1); // only the un-added track was posted
    expect(calls[0]?.body).toMatchObject({ resourceUrl: "https://youtu.be/b" });
  });

  it("counts failures and leaves their flag falsy for retry", async () => {
    let n = 0;
    const { fetchImpl } = mockFetch(() => {
      n++;
      return n === 1
        ? { status: 400, body: { message: "bad url", error: "Bad Request", statusCode: 400 } }
        : selectionRoute();
    });
    const client = createClient({ fetch: fetchImpl, token: "t", maxRetries: 0 });
    const tracks: TrackEntry[] = [
      { url: "https://youtu.be/bad" },
      { url: "https://youtu.be/ok" },
    ];

    const result = await importTracks(client, { tracks, gameId: 1 });

    expect(result.failed).toBe(1);
    expect(result.added).toBe(1);
    expect(tracks[0]?.added_to_uwufufu).toBeUndefined();
    expect(tracks[1]?.added_to_uwufufu).toBe(true);
  });

  it("throws when neither gameId nor create is provided", async () => {
    const { fetchImpl } = mockFetch(() => selectionRoute());
    const client = createClient({ fetch: fetchImpl, token: "t" });
    await expect(importTracks(client, { tracks: [] })).rejects.toThrow();
  });

  it("emits progress events including game and added", async () => {
    const { fetchImpl } = mockFetch((c) => {
      if (c.path === "/v1/games") return { status: 201, body: draft };
      return selectionRoute();
    });
    const client = createClient({ fetch: fetchImpl, token: "t" });
    const events: string[] = [];
    await importTracks(client, {
      tracks: [{ url: "https://youtu.be/a" }],
      create: { title: "T", description: "D", categoryId: 16 },
      onProgress: (e) => {
        events.push(e.type);
      },
    });
    expect(events[0]).toBe("game");
    expect(events).toContain("added");
  });
});
