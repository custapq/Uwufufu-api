import type { HttpClient } from "../http.js";
import type {
  PickResult,
  StartedGame,
  StartGameResult,
} from "../types.js";

/** Bracket size — must be a power of two. */
export type RoundsOf = 2 | 4 | 8 | 16 | 32 | 64;

/** Gameplay (started-game) endpoints. */
export class GameplayResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * `POST /started-games` — begin a play-through of a worldcup.
   *
   * Returns the first match to display. Keep `startedGame.id` to drive
   * subsequent {@link pick} calls.
   *
   * @example
   * ```ts
   * const { startedGame, match } = await client.gameplay.start(gameId, 8);
   * ```
   */
  start(gameId: number, roundsOf: RoundsOf): Promise<StartGameResult> {
    return this.http.request<StartGameResult>("POST", "/started-games", {
      body: { gameId, roundsOf },
    });
  }

  /**
   * `POST /started-games/pick` — pick a winner for the current match.
   *
   * Returns the next match in `result.match`. When `match` is absent and
   * `result.startedGame.status === "IS_COMPLETED"`, the run is over and the
   * winner is the selection you just picked (`pickedSelectionId`).
   *
   * @example
   * ```ts
   * const result = await client.gameplay.pick(startedGameId, matchId, selectionId);
   * if (!result.match) {
   *   console.log("Winner:", pickedSelectionId);
   * }
   * ```
   */
  pick(
    startedGameId: number,
    matchId: number,
    pickedSelectionId: number,
  ): Promise<PickResult> {
    return this.http.request<PickResult>("POST", "/started-games/pick", {
      body: { startedGameId, matchId, pickedSelectionId },
    });
  }

  /**
   * `GET /started-games` — list in-progress games for the authenticated user.
   */
  list(): Promise<StartedGame[]> {
    return this.http.request<StartedGame[]>("GET", "/started-games");
  }

  /**
   * `GET /started-games/:id` — get a started game (and current match) by id.
   * Use this to resume an in-progress run.
   */
  get(id: number): Promise<StartGameResult> {
    return this.http.request<StartGameResult>("GET", `/started-games/${id}`);
  }
}
