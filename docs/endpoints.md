# Endpoint Catalog

Base URL: **`https://api.uwufufu.com/v1`**
Auth: **`Authorization: Bearer <accessToken>`** (see [auth.md](./auth.md))

Reverse-engineered from observed network traffic; undocumented and subject to change.
Full master catalog (with shapes and notes) at [`api-catalog.md`](./api-catalog.md).

> Terminology: uwufufu calls a game a **"worldcup"** (a bracket/tournament). The
> public URL is `/worldcup/:slug`; the editor is `/create-game/:id`.

---

## 1. Create a worldcup

`POST /v1/games`

Creates an empty worldcup. It starts as `IS_CLOSED` (draft). The server
generates the `id` and a `slug` from the title.

Request:

```json
{
  "id": 0,
  "title": "API Test - Song Battle",
  "description": "Reverse-engineering test game",
  "visibility": "IS_CLOSED",
  "categoryId": 19,
  "isNsfw": false,
  "createdAt": "2026-06-06T14:35:10.571Z",
  "updatedAt": "2026-06-06T14:35:10.571Z"
}
```

> Minimal body that works: `title`, `description`, `visibility`, `categoryId`,
> `isNsfw`. (`id: 0` and the timestamps are sent by the web client but assigned
> server-side.)

Response `201`:

```json
{
  "id": 159215,
  "title": "API Test - Song Battle",
  "description": "Reverse-engineering test game",
  "visibility": "IS_CLOSED",
  "coverImage": null,
  "slug": "api-test---song-battle-custapq",
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

---

## 2. Add a song (video selection)

`POST /v1/selections/video`

Adds one YouTube selection to a worldcup. The server fetches the video's title
automatically and derives the embed URL + thumbnail.

Request:

```json
{
  "worldcupId": 159215,
  "resourceUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "startTime": 0,
  "endTime": 30
}
```

- `worldcupId` — the game `id` from step 1.
- `resourceUrl` — a YouTube watch URL.
- `startTime` / `endTime` — clip bounds in **seconds**.

Response `201`:

```json
{
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
  "_note": "Observed quirk: top-level `gameId` matched the worldcup (159215) but the nested `game.id` did not (159211). Trust `gameId` / the `worldcupId` you sent.",
  "id": 11832271,
  "wins": 0, "losses": 0, "finalWins": 0, "finalLosses": 0,
  "finalWinLossRatio": 0, "winLossRatio": 0,
  "createdAt": "2026-06-06T14:36:40.343Z",
  "updatedAt": "2026-06-06T14:36:40.343Z",
  "deletedAt": null
}
```

> A worldcup needs a power-of-two number of selections to be playable; add at
> least 2 (ideally 4, 8, 16, …) before publishing.

---

## 3. Update / publish a worldcup

`PUT /v1/games/:id`

Used both to edit metadata (title/description/category/language) and to
**publish** by switching `visibility` to `IS_PUBLIC`.

Request (publish):

```json
{
  "id": 159215,
  "title": "API Test - Song Battle",
  "description": "Reverse-engineering test game",
  "visibility": "IS_PUBLIC",
  "coverImage": null,
  "slug": "api-test---song-battle-custapq",
  "isNsfw": false,
  "categoryId": 16,
  "locale": "en"
}
```

Key fields for publishing: `visibility: "IS_PUBLIC"`, `categoryId`, `locale`.

Response `200`: the updated game object (same shape as step 1's response, with
`visibility: "IS_PUBLIC"` and `category` populated).

---

## 4. Read your worldcups

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/v1/games/mine` | List worldcups owned by the authed user |
| `GET` | `/v1/games/:id/mine` | One owned worldcup (metadata + `selectionCount`) |

`GET /v1/games/:id/mine` response:

```json
{
  "id": 159215,
  "title": "API Test - Song Battle",
  "description": "Reverse-engineering test game",
  "visibility": "IS_PUBLIC",
  "coverImage": null,
  "slug": "api-test---song-battle-custapq",
  "isNsfw": false,
  "category": { "id": 16, "name": "Music" },
  "locale": "en",
  "selectionCount": 4,
  "isAdRestricted": false,
  "createdAt": "2026-06-06T14:35:12.400Z",
  "updatedAt": "2026-06-06T14:38:56.749Z",
  "user": { "id": 777086, "name": "custapq", "profileImage": null },
  "plays": 0,
  "finishedPlays": 0
}
```

---

## Enums

### `visibility`

| Value | Meaning |
| ----- | ------- |
| `IS_PUBLIC` | Listed publicly |
| `IS_PRIVATE` | Unlisted (link only) |
| `IS_CLOSED` | Draft / not playable |

### `locale`

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

(Full category list available at `GET /v1/categories`.)

---

## Full flow summary

```
POST /v1/auth/login            → accessToken
POST /v1/games                 → { id, slug }          (draft, IS_CLOSED)
POST /v1/selections/video  ×N  → add songs             (worldcupId = id)
PUT  /v1/games/:id             → visibility=IS_PUBLIC  (publish)
```

---

## 5. Browse public worldcups

`GET /v1/games`

No auth required. Returns a paginated list of public worldcups.

Query params:

| Param | Type | Notes |
| ----- | ---- | ----- |
| `page` | number | 1-based (default 1) |
| `perPage` | number | default 10 |
| `search` | string | free-text |
| `sortBy` | string | e.g. `"plays"`, `"newest"` |
| `includeNsfw` | boolean | default false |

Response `200`:

```json
{
  "page": 1,
  "perPage": 10,
  "total": 312,
  "worldcups": [{ "id": 159215, "title": "…", "slug": "…", "plays": 42 }]
}
```

---

## 6. Delete a worldcup

`DELETE /v1/games/:id`  Auth required (owner only).

Response `200` (no body). **Irreversible** — deletes the worldcup and all its selections.

---

## 7. List selections (public)

`GET /v1/selections`

No auth required. Returns selections for a worldcup with win/loss stats — use this to derive rankings.

Query params:

| Param | Type | Notes |
| ----- | ---- | ----- |
| `worldcupId` | number | **required** |
| `page` | number | 1-based |
| `perPage` | number | |
| `keyword` | string | search by name |
| `sortBy` | string | `name` \| `createdAt` \| `winLossRatio` \| `finalWinLossRatio` |

Response `200`:

```json
{
  "page": 1,
  "perPage": 10,
  "total": 4,
  "data": [
    {
      "id": 11832610,
      "name": "Song A",
      "isVideo": true,
      "videoSource": "youtube",
      "wins": 3,
      "losses": 1,
      "winLossRatio": 0.75,
      "finalWins": 1,
      "finalLosses": 0,
      "finalWinLossRatio": 1.0
    }
  ]
}
```

> Rankings are derived from this endpoint — there is no separate `/rankings` REST endpoint (it's server-rendered).

---

## 8. List selections (owner)

`GET /v1/selections/mine`  Auth required.

Same query params and response shape as `GET /v1/selections`. Use this when you need owner-only fields.

---

## 9. Delete a selection

`DELETE /v1/selections/:id`  Auth required (owner only).

Response `200` (no body). **Irreversible.**

---

## 10. Gameplay — start a run

`POST /v1/started-games`  Auth required.

Request:

```json
{ "gameId": 159215, "roundsOf": 4 }
```

`roundsOf` is the bracket size — must be a power of two (2, 4, 8, 16, …) and ≤ the number of selections.

Response `201`:

```json
{
  "startedGame": { "id": 17295538, "roundsOf": 4, "status": "IN_PROGRESS" },
  "match": {
    "id": 724694629,
    "roundsOf": 4,
    "selection1": { "id": 11832610, "name": "Song A", "isVideo": true, "videoSource": "youtube", "videoUrl": "…", "startTime": 0, "endTime": 20, "resourceUrl": "…" },
    "selection2": { "id": 11832611, "name": "Song B", "isVideo": true, "videoSource": "youtube", "videoUrl": "…", "startTime": 0, "endTime": 20, "resourceUrl": "…" },
    "winnerId": null
  },
  "matchNumberInRound": 1
}
```

---

## 11. Gameplay — pick a winner

`POST /v1/started-games/pick`  Auth required.

Request:

```json
{ "startedGameId": 17295538, "matchId": 724694629, "pickedSelectionId": 11832610 }
```

Response `201`: same shape as the start response, with an added `previousMatch`. The next `match` to display is in `result.match`.

**Game-over condition:** when `match` is absent in the response and `startedGame.status === "IS_COMPLETED"`, the bracket is finished. The winner is the `pickedSelectionId` you just sent — there is no separate result endpoint.

---

## 12. Gameplay — list / resume runs

| Method | Path | Notes |
| ------ | ---- | ----- |
| `GET` | `/v1/started-games` | All in-progress runs for the authed user |
| `GET` | `/v1/started-games/:id` | One run (same shape as the start response) |

---

## Not REST endpoints (server-rendered)

These **do not have a JSON API endpoint** — they are server-rendered by Next.js:

- Public single worldcup by `id`/`slug` — use the site URL `uwufufu.com/worldcup/:slug`.
- Public user profile — no `/users/:id` endpoint; own user via `GET /auth/me` only.
- Worldcup rankings — derive from `GET /selections?worldcupId=:id&sortBy=winLossRatio`.
