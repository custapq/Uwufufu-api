import { HttpClient, type ClientConfig, type RequestOptions } from "./http.js";
import type { LoginResponse, User } from "./types.js";
import { GamesResource } from "./resources/games.js";
import { GameplayResource } from "./resources/gameplay.js";
import { SelectionsResource } from "./resources/selections.js";

/**
 * The uwufufu API client. Create it with {@link createClient}.
 *
 * Phase 3 establishes the core: configuration, auth, typed errors, retries,
 * and a low-level `request` escape hatch. Resource helpers (games, selections)
 * are layered on in Phase 4.
 */
export class UwufufuClient {
  private readonly http: HttpClient;

  /** Worldcup ("game") endpoints. */
  readonly games: GamesResource;
  /** Selection (bracket entry) endpoints. */
  readonly selections: SelectionsResource;
  /** Gameplay (started-game) endpoints. */
  readonly gameplay: GameplayResource;

  constructor(config: ClientConfig = {}) {
    this.http = new HttpClient(config);
    this.games = new GamesResource(this.http);
    this.selections = new SelectionsResource(this.http);
    this.gameplay = new GameplayResource(this.http);
  }

  /** Set or replace the access token used for `Authorization: Bearer`. */
  setToken(token: string | undefined): void {
    this.http.setToken(token);
  }

  /**
   * Low-level typed request. Prefer the resource helpers once they exist;
   * this is the escape hatch for endpoints the SDK doesn't model yet.
   */
  request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    return this.http.request<T>(method, path, options);
  }

  /** Auth-related endpoints. */
  readonly auth = {
    /**
     * `POST /auth/login` — exchange email + password for an access token.
     *
     * On success the returned token is stored on this client automatically
     * (so subsequent calls are authenticated), and also returned to the caller.
     *
     * @example
     * ```ts
     * const { accessToken } = await client.auth.login(email, password);
     * ```
     */
    login: async (email: string, password: string): Promise<LoginResponse> => {
      const result = await this.http.request<LoginResponse>(
        "POST",
        "/auth/login",
        { body: { email, password } },
      );
      this.http.setToken(result.accessToken);
      return result;
    },

    /** `GET /auth/me` — the authenticated user. Requires a token. */
    me: (): Promise<User> => this.http.request<User>("GET", "/auth/me"),
  };
}

/**
 * Create a uwufufu API client.
 *
 * @example
 * ```ts
 * const client = createClient({ token: process.env.UWUFUFU_TOKEN });
 * const me = await client.auth.me();
 * ```
 *
 * The token is the `accessToken` issued by login (the `accessToken` cookie
 * in-browser). See docs/auth.md for how to obtain it.
 */
export function createClient(config: ClientConfig = {}): UwufufuClient {
  return new UwufufuClient(config);
}
