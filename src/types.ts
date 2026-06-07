/**
 * Types for the uwufufu API, derived from observed traffic (Phase 1 recon).
 * Base URL: https://api.uwufufu.com/v1
 *
 * Scope: the create-game (video) flow. These shapes reflect what the API
 * actually returned and may be incomplete for fields not exercised by that flow.
 */

// ----------------------------------------------------------------------------
// Enums / unions
// ----------------------------------------------------------------------------

/** Worldcup visibility. */
export type Visibility = "IS_PUBLIC" | "IS_PRIVATE" | "IS_CLOSED";

/** Supported worldcup locales (BCP-47-ish codes used by uwufufu). */
export type Locale =
  | "ar"
  | "da"
  | "de"
  | "el"
  | "en"
  | "es"
  | "fi"
  | "fil"
  | "fr"
  | "hi"
  | "hu"
  | "id"
  | "it"
  | "ja"
  | "ko"
  | "mn"
  | "nl"
  | "pl"
  | "pt-BR"
  | "pt"
  | "ru"
  | "sv"
  | "th"
  | "tr"
  | "vi"
  | "zh-Hant"
  | "zh";

/** Source of a video selection. So far only YouTube has been observed. */
export type VideoSource = "youtube";

// ----------------------------------------------------------------------------
// Entities
// ----------------------------------------------------------------------------

/** The authenticated user (`GET /v1/auth/me`). */
export interface User {
  id: number;
  email: string;
  name: string;
  isVerified: boolean;
  profileImage: string | null;
  tier: string;
  subscriptionEndDate: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Compact author reference embedded in game responses. */
export interface GameUser {
  id: number;
  name: string;
  profileImage: string | null;
}

/** A worldcup category (`GET /v1/categories`). */
export interface Category {
  id: number;
  name: string;
  deletedAt?: string | null;
}

/**
 * A worldcup (called a "game" in API paths). Returned by `POST /v1/games`,
 * `PUT /v1/games/:id`, and `GET /v1/games/:id/mine`.
 *
 * Note: `POST`/`PUT` responses carry no `category`/`selectionCount`; the
 * `/mine` reads add `category` (object) and `selectionCount`.
 */
export interface Game {
  id: number;
  title: string;
  description: string;
  visibility: Visibility;
  coverImage: string | null;
  slug: string;
  isNsfw: boolean;
  locale: Locale | null;
  isAdRestricted: boolean;
  createdAt: string;
  updatedAt: string;
  user: GameUser;
  plays: number;
  finishedPlays: number;
  /** Present on `/mine` reads. */
  category?: Category | null;
  /** Present on `/mine` reads. */
  selectionCount?: number;
}

/**
 * A selection (one entry/contestant in a worldcup bracket). This is the video
 * variant returned by `POST /v1/selections/video`.
 */
export interface VideoSelection {
  id: number;
  gameId: number;
  /** Auto-fetched from the video (e.g. the YouTube title). */
  name: string;
  isVideo: true;
  videoSource: VideoSource;
  /** Embed URL derived by the server. */
  videoUrl: string;
  startTime: number;
  endTime: number;
  /** Thumbnail URL derived by the server. */
  resourceUrl: string;
  /**
   * Observed quirk: this nested `game.id` did not always match the top-level
   * `gameId`. Prefer `gameId` / the `worldcupId` you sent.
   */
  game: { id: number };
  mongoId: string | null;
  wins: number;
  losses: number;
  finalWins: number;
  finalLosses: number;
  finalWinLossRatio: number;
  winLossRatio: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Paginated worldcup list, as returned by `GET /games/mine` and the public
 * `GET /games` search.
 */
export interface WorldcupPage {
  page: number;
  perPage: number;
  total: number;
  worldcups: Game[];
}

/**
 * Paginated selection list, as returned by `GET /selections` (public) and
 * `GET /selections/mine` (owner).
 */
export interface SelectionPage {
  page: number;
  perPage: number;
  total: number;
  data: VideoSelection[];
}

/** Sort options for selection listings. */
export type SelectionSortBy =
  | "name"
  | "createdAt"
  | "winLossRatio"
  | "finalWinLossRatio";

// ----------------------------------------------------------------------------
// Gameplay
// ----------------------------------------------------------------------------

/** Lifecycle of a played game (a "started game"). */
export type StartedGameStatus = "IN_PROGRESS" | "IS_COMPLETED";

/** A started game (one play-through of a worldcup). */
export interface StartedGame {
  id: number;
  roundsOf: number;
  status: StartedGameStatus;
}

/** A selection as presented inside a match (lighter than {@link VideoSelection}). */
export interface MatchSelection {
  id: number;
  name: string;
  isVideo: boolean;
  videoSource: VideoSource | null;
  videoUrl: string | null;
  startTime: number;
  endTime: number;
  resourceUrl: string;
}

/** A single head-to-head match within a started game. */
export interface Match {
  id: number;
  roundsOf: number;
  selection1: MatchSelection;
  selection2: MatchSelection;
  /** Set once the match has been decided. */
  winnerId: number | null;
}

/** Response of `POST /started-games`. */
export interface StartGameResult {
  startedGame: StartedGame;
  match: Match;
  matchNumberInRound: number;
}

/**
 * Response of `POST /started-games/pick`. When `match` is absent and
 * `startedGame.status === "IS_COMPLETED"`, the game is over and the winner is
 * the `pickedSelectionId` you just sent.
 */
export interface PickResult {
  startedGame: StartedGame;
  previousMatch: Match;
  match?: Match;
  matchNumberInRound?: number;
}

// ----------------------------------------------------------------------------
// Request bodies
// ----------------------------------------------------------------------------

/** `POST /v1/started-games` — begin a play-through. */
export interface StartGameRequest {
  gameId: number;
  /** Bracket size (power of two): 2, 4, 8, 16, … */
  roundsOf: number;
}

/** `POST /v1/started-games/pick` — pick a winner for the current match. */
export interface PickRequest {
  startedGameId: number;
  matchId: number;
  pickedSelectionId: number;
}


/** `POST /v1/auth/login` */
export interface LoginRequest {
  email: string;
  /** 8–50 characters. */
  password: string;
}

/** `POST /v1/auth/login` response (status 201). */
export interface LoginResponse {
  /** Bearer access token; also set as the `accessToken` cookie in-browser. */
  accessToken: string;
}

/**
 * `POST /v1/games` — create a draft worldcup.
 * The web client also sends `id: 0` and timestamps, but those are assigned
 * server-side, so they are optional here.
 */
export interface CreateGameRequest {
  title: string;
  description: string;
  /** Drafts start as `IS_CLOSED`. */
  visibility: Visibility;
  categoryId: number;
  isNsfw: boolean;
  id?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** `POST /v1/selections/video` — add a YouTube selection to a worldcup. */
export interface AddVideoSelectionRequest {
  /** The worldcup (game) id. */
  worldcupId: number;
  /** A YouTube watch URL. */
  resourceUrl: string;
  /** Clip start, in seconds. */
  startTime: number;
  /** Clip end, in seconds. */
  endTime: number;
}

/**
 * `PUT /v1/games/:id` — update worldcup metadata. Also used to publish by
 * setting `visibility: "IS_PUBLIC"`. The web client echoes the whole game
 * object; in practice the meaningful fields are below.
 */
export interface UpdateGameRequest {
  id: number;
  title?: string;
  description?: string;
  visibility?: Visibility;
  categoryId?: number;
  locale?: Locale;
  isNsfw?: boolean;
  coverImage?: string | null;
  slug?: string;
}

// ----------------------------------------------------------------------------
// Error shape
// ----------------------------------------------------------------------------

/** Standard error body returned by the API. */
export interface ApiErrorBody {
  message: string | string[];
  error: string;
  statusCode: number;
}
