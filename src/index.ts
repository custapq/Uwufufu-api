/**
 * uwufufu-api — Unofficial TypeScript SDK for uwufufu.com
 *
 * Reverse-engineered from observed network traffic; not affiliated with or
 * endorsed by uwufufu. See docs/ for the API reference.
 */

export const VERSION = "0.0.0";

// Client
export { createClient, UwufufuClient } from "./client.js";
export { HttpClient, DEFAULT_BASE_URL } from "./http.js";
export type { ClientConfig, RequestOptions } from "./http.js";

// Errors
export { UwufufuApiError, isUwufufuApiError } from "./errors.js";

// Types
export type {
  Visibility,
  Locale,
  VideoSource,
  User,
  GameUser,
  Category,
  Game,
  VideoSelection,
  LoginRequest,
  LoginResponse,
  CreateGameRequest,
  AddVideoSelectionRequest,
  UpdateGameRequest,
  ApiErrorBody,
} from "./types.js";
