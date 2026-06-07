<div align="center">

# uwufufu-api

**Unofficial TypeScript SDK + full API reference for [uwufufu.com](https://uwufufu.com)**

</div>

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Auth](#auth)
  - [POST /auth/login](#post-authlogin)
  - [GET /auth/me](#get-authme)
- [Games](#games)
  - [GET /games — Browse](#get-games--browse-public-worldcups)
  - [POST /games — Create](#post-games--create-a-worldcup)
  - [GET /games/mine — List yours](#get-gamesmine--list-your-worldcups)
  - [GET /games/:id/mine — Get one](#get-gamesidmine--get-one-worldcup-you-own)
  - [PUT /games/:id — Update / publish](#put-gamesid--update--publish-a-worldcup)
  - [DELETE /games/:id — Delete](#delete-gamesid--delete-a-worldcup)
  - [GET /categories](#get-categories--list-categories)
- [Selections](#selections)
  - [POST /selections/video — Add YouTube](#post-selectionsvideo--add-a-youtube-selection)
  - [GET /selections — Public list](#get-selections--list-selections-public)
  - [GET /selections/mine — Owner list](#get-selectionsmine--list-selections-owner)
  - [DELETE /selections/:id — Delete](#delete-selectionsid--delete-a-selection)
- [Gameplay](#gameplay)
  - [POST /started-games — Start](#post-started-games--start-a-play-through)
  - [POST /started-games/pick — Pick](#post-started-gamespick--pick-a-winner)
  - [GET /started-games — List runs](#get-started-games--list-in-progress-runs)
  - [GET /started-games/:id — Resume](#get-started-gamesid--get--resume-a-run)
- [Bulk Import](#bulk-import)
- [Errors](#errors)
- [Types](#types)
- [Low-level escape hatch](#low-level-escape-hatch)
- [Known gaps](#known-gaps)

> [!WARNING]
> Not affiliated with, endorsed by, or supported by uwufufu. Everything here was **reverse-engineered from network traffic** for interoperability. Endpoints are undocumented and may change or break without notice. Respect uwufufu's Terms of Service and don't hammer the API.

---

## Overview

Base URL: **`https://api.uwufufu.com/v1`**  
Auth: **`Authorization: Bearer <accessToken>`**  
Content-Type: **`application/json`** (request and response)  
Error shape: **`{ message: string | string[], error: string, statusCode: number }`**

The SDK is a dependency-free, fully typed Node.js client that wraps these endpoints. Uses built-in `fetch` (Node 18+). Automatic retries on `429`/`5xx` (honors `Retry-After`).

---

## Setup

No npm package yet — use from source:

```bash
git clone https://github.com/custapq/Uwufufu-api.git
cd uwufufu-api
npm install
npm run build   # compiles to dist/
```

```ts
import { createClient } from "./src/index.js";

const client = createClient({
  token,            // Bearer token (optional; or call auth.login)
  baseUrl,          // default https://api.uwufufu.com/v1
  fetch,            // inject custom fetch (tests/proxies)
  maxRetries,       // 429/5xx retries, default 2
  retryBaseDelayMs, // backoff base ms, default 500
});
```

Get a token from a logged-in browser: DevTools → Application → Cookies → `accessToken`.

---

## Auth

### `POST /auth/login`

Exchange email + password for an access token.

**Request**
```json
{ "email": "you@example.com", "password": "your-password" }
```

**Response `201`**
```json
{ "accessToken": "<token>" }
```

> The token is also set as the `accessToken` cookie in-browser. Password must be 8–50 characters.

**SDK**
```ts
const { accessToken } = await client.auth.login(email, password);
// token is stored on the client automatically
```

---

### `GET /auth/me`

Returns the authenticated user. Requires auth.

**Response `200`**
```json
{
  "id": 777086,
  "email": "you@example.com",
  "name": "custapq",
  "isVerified": true,
  "profileImage": null,
  "tier": "basic",
  "subscriptionEndDate": null,
  "isAdmin": false,
  "createdAt": "2026-06-05T18:14:24.180Z",
  "updatedAt": "2026-06-05T19:52:50.269Z"
}
```

**SDK**
```ts
const me = await client.auth.me();
```

---

## Games

### `GET /games` — Browse public worldcups

No auth required.

**Query params**

| Param | Type | Default | Notes |
| ----- | ---- | ------- | ----- |
| `page` | number | 1 | 1-based |
| `perPage` | number | 10 | |
| `search` | string | — | free-text |
| `sortBy` | string | — | e.g. `"plays"`, `"createdAt"` |
| `includeNsfw` | boolean | false | |

**Response `200`**
```json
{
  "page": 1,
  "perPage": 12,
  "total": 312,
  "worldcups": [
    {
      "id": 159215,
      "title": "Best Song Battle",
      "description": "Vote for the best!",
      "visibility": "IS_PUBLIC",
      "coverImage": "https://…",
      "slug": "best-song-battle-custapq",
      "isNsfw": false,
      "locale": "en",
      "isAdRestricted": false,
      "createdAt": "2026-06-06T14:35:12.400Z",
      "updatedAt": "2026-06-06T14:38:56.749Z",
      "user": { "id": 777086, "name": "custapq", "profileImage": null },
      "plays": 42,
      "finishedPlays": 10
    }
  ]
}
```

**SDK**
```ts
const page = await client.games.browse({ search: "kpop", perPage: 20, sortBy: "plays" });
```

---

### `POST /games` — Create a worldcup

Requires auth. Creates a draft worldcup (`IS_CLOSED`).

**Request**
```json
{
  "title": "Best Song of 2026",
  "description": "Vote for the best track!",
  "visibility": "IS_CLOSED",
  "categoryId": 16,
  "isNsfw": false
}
```

> Minimal required fields: `title`, `description`, `visibility`, `categoryId`, `isNsfw`.
> The web client also sends `id: 0` and timestamps — the server ignores them.

**Response `201`**
```json
{
  "id": 159215,
  "title": "Best Song of 2026",
  "description": "Vote for the best track!",
  "visibility": "IS_CLOSED",
  "coverImage": null,
  "slug": "best-song-of-2026-custapq",
  "isNsfw": false,
  "locale": null,
  "isAdRestricted": false,
  "createdAt": "2026-06-06T14:35:12.400Z",
  "updatedAt": "2026-06-06T14:35:12.400Z",
  "user": { "id": 777086, "name": "custapq", "profileImage": null },
  "plays": 0,
  "finishedPlays": 0
}
```

**SDK**
```ts
const game = await client.games.create({
  title: "Best Song of 2026",
  description: "Vote for the best track!",
  categoryId: 16,
});
```

---

### `GET /games/mine` — List your worldcups

Requires auth.

**Query params**: `page` (number), `limit` (number)

**Response `200`**: `{ page, perPage, total, worldcups: Game[] }`

**SDK**
```ts
const page = await client.games.listMine({ page: 1, limit: 10 });
```

---

### `GET /games/:id/mine` — Get one worldcup you own

Requires auth. Includes `category` and `selectionCount`.

**Response `200`**
```json
{
  "id": 159215,
  "title": "Best Song of 2026",
  "visibility": "IS_PUBLIC",
  "coverImage": null,
  "slug": "best-song-of-2026-custapq",
  "isNsfw": false,
  "locale": "en",
  "isAdRestricted": false,
  "category": { "id": 16, "name": "Music" },
  "selectionCount": 8,
  "createdAt": "2026-06-06T14:35:12.400Z",
  "updatedAt": "2026-06-06T14:38:56.749Z",
  "user": { "id": 777086, "name": "custapq", "profileImage": null },
  "plays": 42,
  "finishedPlays": 10
}
```

**SDK**
```ts
const game = await client.games.getMine(159215);
```

---

### `PUT /games/:id` — Update / publish a worldcup

Requires auth (owner only). The API requires a full resource body — the SDK's `update` handles the read-then-write merge for you.

**Request**
```json
{
  "id": 159215,
  "title": "Best Song of 2026",
  "description": "Vote for the best track!",
  "visibility": "IS_PUBLIC",
  "coverImage": null,
  "slug": "best-song-of-2026-custapq",
  "isNsfw": false,
  "categoryId": 16,
  "locale": "en"
}
```

**Response `200`**: updated `Game` object.

**SDK**
```ts
// Safe partial update (reads current state first, then PUTs the merged body)
await client.games.update(159215, { title: "New Title" });

// Publish (sets IS_PUBLIC, optionally sets category + locale)
await client.games.publish(159215, { categoryId: 16, locale: "en" });

// Escape hatch — send the exact body yourself
await client.games.replace(159215, { title: "…", visibility: "IS_PUBLIC", /* … */ });
```

> `update` / `publish` cost **two requests** (GET + PUT). The API's PUT requires the full game body, so reading first prevents a partial update from clearing other fields.

---

### `DELETE /games/:id` — Delete a worldcup

Requires auth (owner only). **Irreversible** — deletes the worldcup and all its selections.

**Response `200`** (empty body)

**SDK**
```ts
await client.games.delete(159215);
```

---

### `GET /categories` — List categories

No auth required. Returns all available worldcup categories.

**Response `200`**: `{ id: number, name: string }[]`

**SDK** (escape hatch)
```ts
const cats = await client.request<{ id: number; name: string }[]>("GET", "/categories");
```

**Known category IDs**

| id | name | id | name | id | name |
| -- | ---- | -- | ---- | -- | ---- |
| 1 | Cat | 13 | Money | 25 | Science |
| 2 | Love | 14 | Food | 26 | Shopping |
| 3 | Animals | 15 | WTF | 27 | Nature |
| 4 | Movie | 16 | Music | 28 | Anime |
| 5 | Work | 17 | Ent | 29 | Ask or Tell |
| 6 | LoL | 18 | NSFW | 30 | Politics |
| 7 | K Pop | 19 | etc | 31 | Movie |
| 8 | UwU | 21 | History | 32 | Fashion |
| 9 | Streamer | 22 | Sports | 33 | Cartoons |
| 10 | Lifestyle | 23 | Gaming | 34 | Series |
| 11 | Crypto | 24 | Tech | 35 | TV |
| 12 | Beauty | | | | |

---

## Selections

A **selection** is one contestant in a worldcup bracket (currently: YouTube video clip).

### `POST /selections/video` — Add a YouTube selection

Requires auth. The server fetches the video title and thumbnail automatically.

**Request**
```json
{
  "worldcupId": 159215,
  "resourceUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "startTime": 0,
  "endTime": 30
}
```

| Field | Notes |
| ----- | ----- |
| `worldcupId` | game `id` |
| `resourceUrl` | YouTube watch URL |
| `startTime` / `endTime` | clip bounds in **seconds** (0 = play full video) |

**Response `201`**
```json
{
  "id": 11832271,
  "gameId": 159215,
  "name": "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)",
  "isVideo": true,
  "videoSource": "youtube",
  "videoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "startTime": 0,
  "endTime": 30,
  "resourceUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/sddefault.jpg",
  "game": { "id": 159211 },
  "mongoId": null,
  "wins": 0,
  "losses": 0,
  "finalWins": 0,
  "finalLosses": 0,
  "finalWinLossRatio": 0,
  "winLossRatio": 0,
  "createdAt": "2026-06-06T14:36:40.343Z",
  "updatedAt": "2026-06-06T14:36:40.343Z",
  "deletedAt": null
}
```

> **Observed quirk:** the nested `game.id` may not match the top-level `gameId`. Trust `gameId` / the `worldcupId` you sent.

> A worldcup needs a **power-of-two** number of selections to be playable (2, 4, 8, 16, …). Add at least 2 before publishing.

**SDK**
```ts
await client.selections.addVideo({
  worldcupId: game.id,
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  startTime: 0,
  endTime: 30,
});
```

---

### `GET /selections` — List selections (public)

No auth required. Includes win/loss stats — use this to derive rankings.

**Query params**

| Param | Type | Notes |
| ----- | ---- | ----- |
| `worldcupId` | number | **required** |
| `page` | number | 1-based |
| `perPage` | number | |
| `keyword` | string | search by name |
| `sortBy` | string | `name` \| `createdAt` \| `winLossRatio` \| `finalWinLossRatio` |

**Response `200`**
```json
{
  "page": 1,
  "perPage": 10,
  "total": 8,
  "data": [
    {
      "id": 11832610,
      "name": "Song Title",
      "isVideo": true,
      "videoSource": "youtube",
      "videoUrl": "https://www.youtube.com/embed/…",
      "startTime": 0,
      "endTime": 20,
      "resourceUrl": "https://img.youtube.com/vi/…/sddefault.jpg",
      "wins": 5,
      "losses": 2,
      "winLossRatio": 0.714,
      "finalWins": 2,
      "finalLosses": 0,
      "finalWinLossRatio": 1.0,
      "createdAt": "2026-06-06T14:36:40.343Z",
      "updatedAt": "2026-06-06T14:38:56.749Z"
    }
  ]
}
```

> **Rankings:** sort by `winLossRatio` (all rounds) or `finalWinLossRatio` (finals only). There is no separate `/rankings` REST endpoint — it is server-rendered.

**SDK**
```ts
const page = await client.selections.list({
  worldcupId: 159215,
  sortBy: "winLossRatio",
  perPage: 20,
});
```

---

### `GET /selections/mine` — List selections (owner)

Requires auth. Same query params and response shape as `GET /selections`.

**SDK**
```ts
const page = await client.selections.listMine({ worldcupId: 159215 });
```

---

### `DELETE /selections/:id` — Delete a selection

Requires auth (owner only). **Irreversible.**

**Response `200`** (empty body)

**SDK**
```ts
await client.selections.delete(11832271);
```

---

## Gameplay

A **started game** is one play-through (bracket run) of a worldcup.

### `POST /started-games` — Start a play-through

Requires auth.

**Request**
```json
{ "gameId": 159215, "roundsOf": 4 }
```

`roundsOf` = bracket size, must be a power of two (2, 4, 8, 16, …) and ≤ the worldcup's selection count.

**Response `201`**
```json
{
  "startedGame": { "id": 17295538, "roundsOf": 4, "status": "IN_PROGRESS" },
  "match": {
    "id": 724694629,
    "roundsOf": 4,
    "selection1": {
      "id": 11832610,
      "name": "Song A",
      "isVideo": true,
      "videoSource": "youtube",
      "videoUrl": "https://www.youtube.com/embed/…",
      "startTime": 0,
      "endTime": 20,
      "resourceUrl": "https://img.youtube.com/vi/…/sddefault.jpg"
    },
    "selection2": {
      "id": 11832611,
      "name": "Song B",
      "isVideo": true,
      "videoSource": "youtube",
      "videoUrl": "https://www.youtube.com/embed/…",
      "startTime": 0,
      "endTime": 20,
      "resourceUrl": "https://img.youtube.com/vi/…/sddefault.jpg"
    },
    "winnerId": null
  },
  "matchNumberInRound": 1
}
```

**SDK**
```ts
const { startedGame, match } = await client.gameplay.start(159215, 4);
```

---

### `POST /started-games/pick` — Pick a winner

Requires auth.

**Request**
```json
{
  "startedGameId": 17295538,
  "matchId": 724694629,
  "pickedSelectionId": 11832610
}
```

**Response `201` — mid-game** (more matches remain)
```json
{
  "startedGame": { "id": 17295538, "roundsOf": 4, "status": "IN_PROGRESS" },
  "previousMatch": { "…": "…", "winnerId": 11832610 },
  "match": { "id": 724694630, "…": "…" },
  "matchNumberInRound": 2
}
```

**Response `201` — game over** (bracket complete)
```json
{
  "startedGame": { "id": 17295538, "roundsOf": 4, "status": "IS_COMPLETED" },
  "previousMatch": { "…": "…" }
}
```

> **Game-over condition:** `match` is absent **and** `startedGame.status === "IS_COMPLETED"`. The winner is the `pickedSelectionId` you just sent. There is **no separate result endpoint**.

**SDK**
```ts
const result = await client.gameplay.pick(startedGameId, matchId, pickedSelectionId);
if (!result.match) {
  console.log("Winner:", pickedSelectionId);
}
```

**Full gameplay loop example**
```ts
let { startedGame, match } = await client.gameplay.start(gameId, 8);

while (match) {
  // your selection logic — e.g. always pick selection1
  const pickedId = match.selection1.id;
  const result = await client.gameplay.pick(startedGame.id, match.id, pickedId);
  match = result.match;       // undefined when game is over
  startedGame = result.startedGame;
  if (!match) console.log("Winner:", pickedId);
}
```

---

### `GET /started-games` — List in-progress runs

Requires auth. Returns all in-progress started games for the authenticated user.

**Response `200`**: `StartedGame[]` — `[{ id, roundsOf, status }]`

**SDK**
```ts
const runs = await client.gameplay.list();
```

---

### `GET /started-games/:id` — Get / resume a run

Requires auth. Returns the same shape as the start response (current match included).

**SDK**
```ts
const { startedGame, match } = await client.gameplay.get(17295538);
```

---

## Bulk Import

Turn a JSON list of YouTube links into a worldcup in one call.

**JSON file format** (only `url` is required per entry):
```json
[
  { "track_name": "Song A", "artist": "Artist", "url": "https://www.youtube.com/watch?v=…", "added_to_uwufufu": false },
  { "track_name": "Song B", "artist": "Artist", "url": "https://www.youtube.com/watch?v=…", "added_to_uwufufu": false }
]
```

**CLI**
```bash
# Create a new worldcup from the file
UWUFUFU_TOKEN=… UWUFUFU_TITLE="Song Battle" UWUFUFU_CATEGORY_ID=16 \
  npx tsx examples/import-from-json.ts tracks.json

# Append to an existing worldcup
UWUFUFU_TOKEN=… UWUFUFU_GAME_ID=159215 \
  npx tsx examples/import-from-json.ts tracks.json
```

| Env var | Purpose |
| ------- | ------- |
| `UWUFUFU_TOKEN` | Bearer token (or use `UWUFUFU_EMAIL` + `UWUFUFU_PASSWORD`) |
| `UWUFUFU_GAME_ID` | Append to this worldcup (omit to create new) |
| `UWUFUFU_TITLE` / `UWUFUFU_DESCRIPTION` / `UWUFUFU_CATEGORY_ID` / `UWUFUFU_NSFW` | New-worldcup metadata |
| `UWUFUFU_START` / `UWUFUFU_END` | Clip start/end seconds for all tracks (default 0) |

Resume-safe: successful rows are marked `added_to_uwufufu: true` in the file. Re-running skips them.

**Programmatic**
```ts
import { createClient, importTracks } from "./src/index.js";
import { readFile, writeFile } from "node:fs/promises";

const client = createClient({ token: process.env.UWUFUFU_TOKEN });
const tracks = JSON.parse(await readFile("tracks.json", "utf8"));

const result = await importTracks(client, {
  tracks,
  create: { title: "Song Battle", description: "", categoryId: 16 },
  // or: gameId: 159215
  onProgress: () => writeFile("tracks.json", JSON.stringify(tracks, null, 2)),
});
console.log(`added=${result.added} skipped=${result.skipped} failed=${result.failed}`);
// importTracks does NOT publish — call client.games.publish(result.gameId) when ready
```

---

## Errors

Non-2xx responses throw `UwufufuApiError`:

```ts
import { isUwufufuApiError } from "./src/index.js";

try {
  await client.auth.me();
} catch (err) {
  if (isUwufufuApiError(err)) {
    err.status;        // HTTP status code, e.g. 401
    err.endpoint;      // "GET /auth/me"
    err.body;          // { message, error, statusCode } when response is JSON
    err.isAuthError;   // true for 401 / 403
    err.isRateLimited; // true for 429
  }
}
```

**Error body shape**
```json
{ "message": "Unauthorized", "error": "Unauthorized", "statusCode": 401 }
```

`message` may be a `string[]` for validation errors (e.g. bad request body).

---

## Types

All types are exported from the SDK entry point.

### `User`
```ts
interface User {
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
```

### `Game`
```ts
interface Game {
  id: number;
  title: string;
  description: string;
  visibility: "IS_PUBLIC" | "IS_PRIVATE" | "IS_CLOSED";
  coverImage: string | null;
  slug: string;
  isNsfw: boolean;
  locale: string | null;
  isAdRestricted: boolean;
  createdAt: string;
  updatedAt: string;
  user: { id: number; name: string; profileImage: string | null };
  plays: number;
  finishedPlays: number;
  // present on GET /games/:id/mine only:
  category?: { id: number; name: string } | null;
  selectionCount?: number;
}
```

### `VideoSelection`
```ts
interface VideoSelection {
  id: number;
  gameId: number;
  name: string;
  isVideo: true;
  videoSource: "youtube";
  videoUrl: string;     // embed URL
  startTime: number;
  endTime: number;
  resourceUrl: string;  // thumbnail URL
  game: { id: number };
  mongoId: string | null;
  wins: number;
  losses: number;
  finalWins: number;
  finalLosses: number;
  winLossRatio: number;
  finalWinLossRatio: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
```

### `StartedGame` / `Match`
```ts
interface StartedGame {
  id: number;
  roundsOf: number;
  status: "IN_PROGRESS" | "IS_COMPLETED";
}

interface Match {
  id: number;
  roundsOf: number;
  selection1: MatchSelection;
  selection2: MatchSelection;
  winnerId: number | null;
}

interface MatchSelection {
  id: number;
  name: string;
  isVideo: boolean;
  videoSource: "youtube" | null;
  videoUrl: string | null;
  startTime: number;
  endTime: number;
  resourceUrl: string;
}
```

### Enums

**`Visibility`** — `"IS_PUBLIC"` · `"IS_PRIVATE"` · `"IS_CLOSED"`

**`SelectionSortBy`** — `"name"` · `"createdAt"` · `"winLossRatio"` · `"finalWinLossRatio"`

**`Locale`** — `ar, da, de, el, en, es, fi, fil, fr, hi, hu, id, it, ja, ko, mn, nl, pl, pt-BR, pt, ru, sv, th, tr, vi, zh-Hant, zh`

---

## Low-level escape hatch

For endpoints the SDK doesn't model yet:

```ts
const categories = await client.request<{ id: number; name: string }[]>("GET", "/categories");
```

`client.setToken(token)` swaps the token after construction.

---

## Known gaps

Endpoints that exist on the site but were not captured or fully modeled:

| Endpoint | Notes |
| -------- | ----- |
| `POST /selections/image` | Image (non-video) selection — multipart upload, shape unknown |
| Duplicate worldcup | UI button exists; endpoint not captured |
| `PUT /selections/:id` | Selection edit/reorder — not confirmed |
| Signup / logout / password reset / OAuth | Auth extras — not captured |
| Comments / likes / reports | Not captured |
| Subscription / plans | Not captured |
| Public single worldcup | Server-rendered (Next.js RSC) — no JSON endpoint |
| Public user profile | Server-rendered — no `/users/:id` endpoint |

---

## Development

```bash
npm run typecheck   # tsc --noEmit
npm run build       # tsup → dist/
npm test            # vitest (set UWUFUFU_TOKEN for the live integration test)
npm run lint        # eslint
npm run format      # prettier --write
```

Repo layout: [`src/`](./src) (SDK) · [`test/`](./test) (vitest) · [`examples/`](./examples) · [`docs/`](./docs) (OpenAPI + supplemental catalogs) · [`captures/samples/`](./captures/samples) (sanitized traffic samples)

## License

MIT
