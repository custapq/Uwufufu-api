<div align="center">

# uwufufu-api

**Unofficial TypeScript SDK + API docs for [uwufufu.com](https://uwufufu.com)** — create video worldcups, add YouTube songs, and publish, from code.

[Quickstart](#quickstart) · [Import from JSON](#import-tracks-from-a-json-file) · [API reference](#api-reference) · [HTTP endpoints](#http-endpoints) · [Docs](./docs)

</div>

> [!WARNING]
> Not affiliated with, endorsed by, or supported by uwufufu. Everything here was **reverse-engineered from network traffic** for interoperability. Endpoints are undocumented and may change or break without notice. Respect uwufufu's Terms of Service and don't hammer the API.

---

## What it does

A small, dependency-free, fully typed client for the uwufufu **create-a-worldcup (video) flow**:

```
log in  →  create worldcup  →  add YouTube songs  →  publish
```

Highlights:

- 🧩 **Typed** end to end — entities, request bodies, and enums.
- 🔁 **Resilient** — automatic retries on `429`/`5xx` (honors `Retry-After`).
- 📦 **Zero runtime deps** — uses the built-in `fetch` (Node 18+).
- 📥 **Bulk import** — turn a JSON list of YouTube links into a worldcup.

> **Scope:** only the create-video-worldcup flow is modeled. Gameplay/voting, rankings, image selections, cover-image upload, and deletion are not covered yet.

## Install

```bash
npm install uwufufu-api
```

_(Not yet on npm — install from source for now.)_ Requires **Node 18+**. ESM only; types included.

## Quickstart

```ts
import { createClient } from "uwufufu-api";

const client = createClient();
await client.auth.login("you@example.com", "your-password");

const game = await client.games.create({
  title: "Best Song of 2026",
  description: "Vote for the best track!",
  categoryId: 16, // Music — see the category table below
});

await client.selections.addVideo({
  worldcupId: game.id,
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  startTime: 0,
  endTime: 30,
});

const published = await client.games.publish(game.id, { locale: "en" });
console.log(`https://www.uwufufu.com/worldcup/${published.slug}`);
```

> [!CAUTION]
> `publish` makes the worldcup **publicly visible** on your account. Delete it from the site afterwards if it was just a test.

## Authentication

The API uses a **Bearer token**. Get a client authenticated in one of two ways:

```ts
// A) Log in with credentials — the token is stored on the client automatically.
const client = createClient();
await client.auth.login(email, password);

// B) Bring your own token (e.g. the `accessToken` cookie from a logged-in
//    browser: DevTools → Application → Cookies → accessToken).
const client = createClient({ token: process.env.UWUFUFU_TOKEN });
```

Details in [`docs/auth.md`](./docs/auth.md).

## Import tracks from a JSON file

The common use case: you have a list of YouTube links and want them all in one worldcup. Feed an array shaped like this (only `url` is required):

```json
[
  { "track_name": "ดอกกระเจียวบาน - ก้อง ห้วยไร่", "artist": "GeneLab", "url": "https://www.youtube.com/watch?v=Gy-MZjiFv2M", "added_to_uwufufu": false },
  { "track_name": "คำขอ - ก้อง ห้วยไร่", "artist": "SOUND ME HANG", "url": "https://www.youtube.com/watch?v=if2kWWiAsJM", "added_to_uwufufu": false }
]
```

Run the bundled CLI example — it writes `added_to_uwufufu: true` back to the file after each success, so it's **resume-safe** (re-running skips what's done and retries failures):

```bash
# Create a NEW worldcup from the file
UWUFUFU_TOKEN=… UWUFUFU_TITLE="ก้อง ห้วยไร่ Battle" UWUFUFU_CATEGORY_ID=16 \
  npx tsx examples/import-from-json.ts tracks.json

# …or APPEND to an existing worldcup
UWUFUFU_TOKEN=… UWUFUFU_GAME_ID=159215 \
  npx tsx examples/import-from-json.ts tracks.json
```

| Env var | Purpose |
| ------- | ------- |
| `UWUFUFU_TOKEN` | Bearer token (or use `UWUFUFU_EMAIL` + `UWUFUFU_PASSWORD`) |
| `UWUFUFU_GAME_ID` | Append to this worldcup (omit to create a new one) |
| `UWUFUFU_TITLE` / `UWUFUFU_DESCRIPTION` / `UWUFUFU_CATEGORY_ID` / `UWUFUFU_NSFW` | New-worldcup metadata |
| `UWUFUFU_START` / `UWUFUFU_END` | Clip start/end seconds for every track (default 0) |

Or call it programmatically with [`importTracks`](#importtracksclient-options):

```ts
import { createClient, importTracks } from "uwufufu-api";
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
```

> `importTracks` does **not** publish — call `client.games.publish(result.gameId, …)` when you're ready.

## API reference

### `createClient(config)`

```ts
const client = createClient({
  token,            // Bearer token (optional; or call auth.login)
  baseUrl,          // default https://api.uwufufu.com/v1
  fetch,            // inject a fetch implementation (tests/proxies)
  maxRetries,       // 429/5xx retries (default 2)
  retryBaseDelayMs, // backoff base ms (default 500)
});
```

`client.setToken(token)` swaps the token later. `client.request<T>(method, path, opts?)` is the [low-level escape hatch](#low-level-request).

### `client.auth`

| Method | Endpoint | Returns |
| ------ | -------- | ------- |
| `auth.login(email, password)` | `POST /auth/login` | `{ accessToken }` (stored on the client) |
| `auth.me()` | `GET /auth/me` | `User` |

### `client.games`

| Method | Endpoint | Notes |
| ------ | -------- | ----- |
| `games.create({ title, description, categoryId, isNsfw?, visibility? })` | `POST /games` | Draft (`IS_CLOSED`) by default |
| `games.getMine(id)` | `GET /games/:id/mine` | Includes `category` + `selectionCount` |
| `games.listMine({ page?, limit? })` | `GET /games/mine` | `{ page, perPage, total, worldcups }` |
| `games.update(id, changes)` | `PUT /games/:id` | Reads + merges first (safe partial update) |
| `games.publish(id, { categoryId?, locale? })` | `PUT /games/:id` | Sets `IS_PUBLIC` (merge-safe) |
| `games.replace(id, body)` | `PUT /games/:id` | Sends the exact body (escape hatch) |

> `update`/`publish` cost two requests (GET then PUT) because the API's PUT echoes the full resource — reading first prevents a partial update from blanking other fields.

### `client.selections`

| Method | Endpoint | Notes |
| ------ | -------- | ----- |
| `selections.addVideo({ worldcupId, url, startTime?, endTime? })` | `POST /selections/video` | Server fetches the title + thumbnail from YouTube |

> A worldcup needs a power-of-two number of selections to be playable — add at least 2 (ideally 4, 8, 16, …) before publishing.

### `importTracks(client, options)`

Bulk-add tracks to a worldcup (create or append). See [Import from JSON](#import-tracks-from-a-json-file).

```ts
importTracks(client, {
  tracks,                 // TrackEntry[] — mutated: successful rows get added_to_uwufufu = true
  gameId?,                // append target…
  create?,                // …or { title, description, categoryId, isNsfw? } to create
  startTime?, endTime?,   // per-track clip bounds (default 0)
  onProgress?,            // (event) => void | Promise<void> — awaited, for write-back
}): Promise<{ gameId, slug?, created, added, skipped, failed, tracks }>
```

### Errors

Non-2xx responses throw `UwufufuApiError`:

```ts
import { isUwufufuApiError } from "uwufufu-api";

try {
  await client.auth.me();
} catch (err) {
  if (isUwufufuApiError(err)) {
    err.status;        // 401
    err.endpoint;      // "GET /auth/me"
    err.body;          // parsed { message, error, statusCode } when JSON
    err.isAuthError;   // 401/403
    err.isRateLimited; // 429
  }
}
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

**`Visibility`** — `IS_PUBLIC` (listed) · `IS_PRIVATE` (unlisted) · `IS_CLOSED` (draft).

**`Locale`** — `ar, da, de, el, en, es, fi, fil, fr, hi, hu, id, it, ja, ko, mn, nl, pl, pt-BR, pt, ru, sv, th, tr, vi, zh-Hant, zh`.

**`categoryId`**

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

Fetch the live list with `client.request("GET", "/categories")`.

## HTTP endpoints

Base URL: **`https://api.uwufufu.com/v1`** · Auth: `Authorization: Bearer <token>`

| Method | Path | SDK |
| ------ | ---- | --- |
| `POST` | `/auth/login` | `auth.login` |
| `GET` | `/auth/me` | `auth.me` |
| `POST` | `/games` | `games.create` |
| `GET` | `/games/mine` | `games.listMine` |
| `GET` | `/games/:id/mine` | `games.getMine` |
| `PUT` | `/games/:id` | `games.update` / `games.publish` / `games.replace` |
| `POST` | `/selections/video` | `selections.addVideo` |
| `GET` | `/categories` | `client.request` |

Full request/response shapes: [`docs/endpoints.md`](./docs/endpoints.md) · OpenAPI: [`docs/openapi.yaml`](./docs/openapi.yaml).

## Notes & limitations

- **Undocumented & unofficial** — reverse-engineered; may change or break anytime.
- **Rate limits** are unknown — the client retries `429`/`5xx` with backoff, but be conservative; avoid tight loops.
- **Observed quirk:** in the add-selection response, the nested `game.id` didn't always match the top-level `gameId` — trust `gameId` / the `worldcupId` you sent.
- **Login transport:** the web app logs in via XHR (axios); the token comes back in the body and as the `accessToken` cookie.

## Development

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run build       # bundle to dist/ via tsup
npm test            # vitest (offline; set UWUFUFU_TOKEN for the live test)
npm run lint        # eslint
npm run format      # prettier --write
```

Project layout: [`src/`](./src) (SDK) · [`test/`](./test) (vitest) · [`examples/`](./examples) · [`docs/`](./docs) (API reference + OpenAPI) · [`PLAN.md`](./PLAN.md) (roadmap).

## License

MIT
