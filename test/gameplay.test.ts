import { describe, it, expect } from "vitest";
import { createClient } from "../src/index.js";
import { mockFetch } from "./mock.js";

const startedGame = { id: 1001, roundsOf: 4, status: "IN_PROGRESS" };
const match = {
  id: 2001,
  roundsOf: 4,
  selection1: { id: 10, name: "A", isVideo: true, videoSource: "youtube", videoUrl: "u", startTime: 0, endTime: 10, resourceUrl: "r" },
  selection2: { id: 11, name: "B", isVideo: true, videoSource: "youtube", videoUrl: "u", startTime: 0, endTime: 10, resourceUrl: "r" },
  winnerId: null,
};

describe("gameplay", () => {
  it("start posts gameId and roundsOf, returns first match", async () => {
    const body = { startedGame, match, matchNumberInRound: 1 };
    const { fetchImpl, calls } = mockFetch(() => ({ status: 201, body }));
    const client = createClient({ fetch: fetchImpl, token: "t" });

    const result = await client.gameplay.start(42, 4);

    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.path).toBe("/v1/started-games");
    expect(calls[0]?.body).toEqual({ gameId: 42, roundsOf: 4 });
    expect(result.startedGame.id).toBe(1001);
    expect(result.match.id).toBe(2001);
    expect(result.matchNumberInRound).toBe(1);
  });

  it("pick posts the three ids, returns next match", async () => {
    const nextMatch = { ...match, id: 2002 };
    const body = { startedGame, previousMatch: match, match: nextMatch, matchNumberInRound: 2 };
    const { fetchImpl, calls } = mockFetch(() => ({ status: 201, body }));
    const client = createClient({ fetch: fetchImpl, token: "t" });

    const result = await client.gameplay.pick(1001, 2001, 10);

    expect(calls[0]?.path).toBe("/v1/started-games/pick");
    expect(calls[0]?.body).toEqual({ startedGameId: 1001, matchId: 2001, pickedSelectionId: 10 });
    expect(result.match?.id).toBe(2002);
  });

  it("pick with no next match signals game over (IS_COMPLETED)", async () => {
    const completed = { ...startedGame, status: "IS_COMPLETED" };
    const body = { startedGame: completed, previousMatch: match };
    const { fetchImpl } = mockFetch(() => ({ status: 201, body }));
    const client = createClient({ fetch: fetchImpl, token: "t" });

    const result = await client.gameplay.pick(1001, 2001, 10);

    expect(result.startedGame.status).toBe("IS_COMPLETED");
    expect(result.match).toBeUndefined();
  });

  it("list GETs /started-games", async () => {
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body: [startedGame] }));
    const client = createClient({ fetch: fetchImpl, token: "t" });

    const list = await client.gameplay.list();

    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.path).toBe("/v1/started-games");
    expect(list).toHaveLength(1);
  });

  it("get GETs /started-games/:id", async () => {
    const body = { startedGame, match, matchNumberInRound: 1 };
    const { fetchImpl, calls } = mockFetch(() => ({ status: 200, body }));
    const client = createClient({ fetch: fetchImpl, token: "t" });

    await client.gameplay.get(1001);

    expect(calls[0]?.path).toBe("/v1/started-games/1001");
  });
});
