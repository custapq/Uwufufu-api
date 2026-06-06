/**
 * uwufufu-api — Unofficial TypeScript SDK for uwufufu.com
 *
 * This package is reverse-engineered from observed network traffic and is not
 * affiliated with or endorsed by uwufufu. The client surface (createClient,
 * resource methods) is implemented in Phase 3+; Phase 2 establishes the types.
 */

export const VERSION = "0.0.0";

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
  CreateGameRequest,
  AddVideoSelectionRequest,
  UpdateGameRequest,
  ApiErrorBody,
} from "./types.js";
