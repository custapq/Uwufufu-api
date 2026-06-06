# uwufufu-api

> Unofficial, reverse-engineered TypeScript SDK and API documentation for [uwufufu.com](https://uwufufu.com).

[![status](https://img.shields.io/badge/status-alpha-orange)](#status) [![types](https://img.shields.io/badge/types-included-blue)](#) [![license](https://img.shields.io/badge/license-MIT-green)](#license)

⚠️ **Disclaimer** — This project is **not affiliated with, endorsed by, or supported by uwufufu**. It is built by observing the website's network traffic for interoperability and automation. The endpoints are **undocumented and may change without notice**. Use responsibly, respect uwufufu's Terms of Service, and don't hammer the API.

---

## Contents

- [Status](#status)
- [Install](#install)
- [Quickstart](#quickstart)
- [Authentication](#authentication)
- [API Reference](#api-reference)
  - [`createClient(config)`](#createclientconfig)
  - [`client.auth`](#clientauth)
  - [`client.games`](#clientgames)
  - [`client.selections`](#clientselections)
  - [Errors](#errors)
  - [Bulk import from JSON](#bulk-import-from-json)
  - [Low-level `request`](#low-level-request)
- [Enums](#enums)
- [Raw HTTP endpoints](#raw-http-endpoints)
- [Notes & limitations](#notes--limitations)
- [Development](#development)
- [License](#license)

## Status

🟠 **Alpha.** Scope is the **create-a-video-worldcup flow**: log in → create a worldcup → add YouTube song selections → publish. Other areas of the API (gameplay/voting, rankings, image selections, deletion) are **not** modeled yet.

| Phase | Description | Status |
| ----- | ----------- | ------ |
| 0 | Project setup & tooling | ✅ done |
| 1 | API reconnaissance (create-game flow) | ✅ done |
| 2 | API modeling & spec | ✅ done |
| 3 | Core SDK | ✅ done |
| 4 | Feature coverage | ✅ done |
| 5 | Testing & examples | ✅ done |
| 6 | Documentation | ✅ done |

See [`PLAN.md`](./PLAN.md) for the roadmap, [`docs/`](./docs) for the raw API reference, and [`docs/openapi.yaml`](./docs/openapi.yaml) for the OpenAPI spec.

## Install

```bash
npm install uwufufu-api
```

_(Not yet published to npm — install from source for now.)_ Requires **Node 18+** (uses the built-in `fetch`). The package is ESM and ships its own types.

## Quickstart

```ts
import { createClient } from "uwufufu-api";

const client = createClient();

// 1. Log in (or pass a token to createClient — see Authentication).
await client.auth.login("you@example.com", "your-password");

// 2. Create a draft worldcup (Music category = 16).
const game = await client.games.create({
  title: "Best Song of 2026",
  description: "Vote for the best track!",
  categoryId: 16,
});

// 3. Add YouTube songs (the server fetches each title automatically).
for (const url of [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.youtube.com/watch?v=9bZkp7q19f0",
  "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
  "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
]) {
  await client.selections.addVideo({ worldcupId: game.id, url, startTime: 0, endTime: 30 });
}

// 4. Publish it.
const published = await client.games.publish(game.id, { locale: "en" });
console.log(`https://www.uwufufu.com/worldcup/${published.slug}`);
```

A runnable version lives in [`examples/create-video-game.ts`](./examples/create-video-game.ts):

```bash
UWUFUFU_EMAIL=you@example.com UWUFUFU_PASSWORD=secret npm run example
```

> ⚠️ This creates a **real, public** worldcup on your account. Delete it from the site afterwards if it was only a test.

## Authentication

The API authenticates with a **Bearer token**. There are two ways to get a client authenticated:

**A. Log in with the SDK** — exchanges email/password for a token and stores it on the client automatically:

```ts
const client = createClient();
const { accessToken } = await client.auth.login(email, password);
// `accessToken` is now used for every subsequent call.
```

**B. Provide a token you already have** — e.g. the `accessToken` cookie from a logged-in browser session (DevTools → Application → Cookies → `accessToken`):

```ts
const client = createClient({ token: process.env.UWUFUFU_TOKEN });
```

All authenticated requests send `Authorization: Bearer <token>`. See [`docs/auth.md`](./docs/auth.md) for the full auth details.

## API Reference

### `createClient(config)`

Creates a client. All config fields are optional.

```ts
const client = createClient({
  token: "…",            // Bearer token (optional; or call auth.login)
  baseUrl: "…",          // default: https://api.uwufufu.com/v1
  fetch: customFetch,    // inject a fetch implementation (tests, proxies)
  maxRetries: 2,         // retries for 429/5xx (default 2)
  retryBaseDelayMs: 500, // backoff base in ms (default 500)
});
```

| Method | Description |
| ------ | ----------- |
| `client.setToken(token)` | Set/replace the Bearer token. |
| `client.request<T>(method, path, opts?)` | Low-level typed request ([details](#low-level-request)). |
| `client.auth` | [Auth endpoints](#clientauth). |
| `client.games` | [Worldcup endpoints](#clientgames). |
| `client.selections` | [Selection endpoints](#clientselections). |

### `client.auth`

#### `auth.login(email, password): Promise<LoginResponse>`

`POST /auth/login`. Exchanges credentials for an access token, stores it on the client, and returns `{ accessToken }`. Password must be 8–50 characters.

#### `auth.me(): Promise<User>`

`GET /auth/me`. Returns the authenticated user. Requires a token.

```ts
const me = await client.auth.me();
// { id, email, name, isVerified, tier, isAdmin, ... }
```

### `client.games`

#### `games.create(input): Promise<Game>`

`POST /games`. Creates a **draft** worldcup (`visibility: "IS_CLOSED"`).

```ts
await client.games.create({
  title: "My Worldcup",
  description: "…",
  categoryId: 16,        // see Enums
  isNsfw: false,         // optional, default false
  visibility: "IS_CLOSED", // optional, default IS_CLOSED
});
```

#### `games.getMine(id): Promise<Game>`

`GET /games/:id/mine`. One worldcup you own (includes `category` and `selectionCount`).

#### `games.listMine(params?): Promise<WorldcupPage>`

`GET /games/mine`. Your worldcups, paginated: `{ page, perPage, total, worldcups }`.

```ts
const { worldcups, total } = await client.games.listMine({ page: 1, limit: 20 });
```

#### `games.update(id, changes): Promise<Game>`

`PUT /games/:id`. Updates metadata. To avoid the API's full-replace PUT wiping
fields, this **reads the current worldcup first and merges** your changes:

```ts
await client.games.update(game.id, { title: "New title", categoryId: 7 });
```

> Costs two requests (a GET then a PUT). Use [`replace`](#gamesreplaceid-body-promisegame) if you want a single PUT with an exact body.

#### `games.publish(id, options?): Promise<Game>`

Publishes by setting `visibility: "IS_PUBLIC"` (merge-safe, like `update`). Optionally set `categoryId` / `locale` at the same time.

```ts
await client.games.publish(game.id, { locale: "en" });
```

#### `games.replace(id, body): Promise<Game>`

`PUT /games/:id` with the exact body you pass (plus `id`). Escape hatch; prefer `update`/`publish` unless you need full control.

### `client.selections`

#### `selections.addVideo(input): Promise<VideoSelection>`

`POST /selections/video`. Adds a YouTube selection to a worldcup. The server fetches the video title and derives the embed URL + thumbnail.

```ts
await client.selections.addVideo({
  worldcupId: game.id,
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  startTime: 0,   // seconds, optional (default 0)
  endTime: 30,    // seconds, optional (default 0 = full video)
});
```

> A worldcup needs a power-of-two number of selections to be playable — add at least 2 (ideally 4, 8, 16, …) before publishing.

### Errors

Non-2xx responses throw `UwufufuApiError`:

```ts
import { isUwufufuApiError } from "uwufufu-api";

try {
  await client.games.create({ title: "x", description: "y", categoryId: 16 });
} catch (err) {
  if (isUwufufuApiError(err)) {
    err.status;        // e.g. 400
    err.endpoint;      // "POST /games"
    err.body;          // parsed { message, error, statusCode } when JSON
    err.isAuthError;   // true for 401/403
    err.isRateLimited; // true for 429
  }
}
```

`429` and `5xx` responses are retried automatically (honoring `Retry-After`) up to `maxRetries` before the error is thrown.

### Bulk import from JSON

`importTracks(client, options)` adds a list of YouTube tracks to a worldcup —
creating a new one or appending to an existing `gameId`. Rows already marked
`added_to_uwufufu: true` are skipped, and failed rows are left unmarked so a
re-run retries them.

Input shape (only `url` is required):

```json
[
  { "track_name": "ดอกกระเจียวบาน - ก้อง ห้วยไร่", "artist": "GeneLab", "url": "https://www.youtube.com/watch?v=Gy-MZjiFv2M", "added_to_uwufufu": false },
  { "track_name": "คำขอ - ก้อง ห้วยไร่", "artist": "SOUND ME HANG", "url": "https://www.youtube.com/watch?v=if2kWWiAsJM", "added_to_uwufufu": false }
]
```

```ts
import { createClient, importTracks } from "uwufufu-api";
import { readFile, writeFile } from "node:fs/promises";

const client = createClient({ token: process.env.UWUFUFU_TOKEN });
const tracks = JSON.parse(await readFile("tracks.json", "utf8"));

const result = await importTracks(client, {
  tracks,
  create: { title: "ก้อง ห้วยไร่ Song Battle", description: "", categoryId: 16 },
  // or: gameId: 159215  // append to an existing worldcup
  onProgress: () => writeFile("tracks.json", JSON.stringify(tracks, null, 2)),
});
// result: { gameId, slug, created, added, skipped, failed, tracks }
```

A runnable CLI wrapper is in [`examples/import-from-json.ts`](./examples/import-from-json.ts) — it writes the flag back to the file after each success so it's resume-safe:

```bash
# Create a new worldcup from the file
UWUFUFU_TOKEN=… UWUFUFU_TITLE="Song Battle" UWUFUFU_CATEGORY_ID=16 \
  npx tsx examples/import-from-json.ts tracks.json

# Or append to an existing one
UWUFUFU_TOKEN=… UWUFUFU_GAME_ID=159215 \
  npx tsx examples/import-from-json.ts tracks.json
```

### Low-level `request`

For endpoints the SDK doesn't model yet:

```ts
const categories = await client.request<{ id: number; name: string }[]>(
  "GET",
  "/categories",
);
```

## Enums

### `Visibility`

| Value | Meaning |
| ----- | ------- |
| `IS_PUBLIC` | Listed publicly |
| `IS_PRIVATE` | Unlisted (link only) |
| `IS_CLOSED` | Draft / not playable |

### `Locale`

`ar, da, de, el, en, es, fi, fil, fr, hi, hu, id, it, ja, ko, mn, nl, pl, pt-BR, pt, ru, sv, th, tr, vi, zh-Hant, zh`

### `categoryId`

| id | name | id | name | id | name |
| -- | ---- | -- | ---- | -- | ---- |
| 19 | etc | 13 | Money | 27 | Nature |
| 1 | Cat | 14 | Food | 28 | Anime |
| 2 | Love | 15 | WTF | 29 | Ask or Tell |
| 3 | Animals | 16 | Music | 30 | Politics |
| 4 | Movie | 17 | Ent | 31 | Movie |
| 5 | Work | 18 | NSFW | 32 | Fashion |
| 6 | LoL | 21 | History | 33 | Cartoons |
| 7 | K Pop | 22 | Sports | 34 | Series |
| 8 | UwU | 23 | Gaming | 35 | TV |
| 9 | Streamer | 24 | Tech | | |
| 10 | Lifestyle | 25 | Science | | |
| 11 | Crypto | 26 | Shopping | | |
| 12 | Beauty | | | | |

Fetch the live list any time with `client.request("GET", "/categories")`.

## Raw HTTP endpoints

Base URL: **`https://api.uwufufu.com/v1`**

| Method | Path | Purpose | SDK |
| ------ | ---- | ------- | --- |
| `POST` | `/auth/login` | Log in → `{ accessToken }` | `auth.login` |
| `GET` | `/auth/me` | Current user | `auth.me` |
| `POST` | `/games` | Create draft worldcup | `games.create` |
| `GET` | `/games/mine` | List own worldcups (paginated) | `games.listMine` |
| `GET` | `/games/:id/mine` | Get one own worldcup | `games.getMine` |
| `PUT` | `/games/:id` | Update / publish | `games.update` / `games.publish` / `games.replace` |
| `POST` | `/selections/video` | Add YouTube selection | `selections.addVideo` |
| `GET` | `/categories` | List categories | `client.request` |

Full request/response shapes: [`docs/endpoints.md`](./docs/endpoints.md) · OpenAPI: [`docs/openapi.yaml`](./docs/openapi.yaml).

## Notes & limitations

- **Unofficial & undocumented.** Endpoints were reverse-engineered and can change or break at any time.
- **Scope.** Only the create-video-worldcup flow is modeled. Gameplay/voting, rankings, image selections, cover-image upload, and deletion are not covered yet.
- **Publishing is real.** `games.publish` makes a worldcup publicly visible on your account.
- **Rate limits.** Unknown/undocumented — the client retries `429`/`5xx` with backoff, but be conservative; don't run tight loops.
- **Observed quirk.** In the add-selection response, the nested `game.id` did not always match the top-level `gameId`; trust `gameId` / the `worldcupId` you sent.
- **Login transport.** The web app sends login via XHR (axios), so it returns the token in the body **and** sets the `accessToken` cookie.

## Development

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run build       # bundle to dist/ via tsup
npm test            # vitest (offline; set UWUFUFU_TOKEN for the live test)
npm run lint        # eslint
npm run format      # prettier --write
```

## License

MIT
