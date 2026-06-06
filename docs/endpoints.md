# Endpoint Catalog — Create-Game (Video) Flow

Base URL: **`https://api.uwufufu.com/v1`**
Auth: **`Authorization: Bearer <accessToken>`** (see [auth.md](./auth.md))

Scope of this catalog: the focused flow **login → create a video worldcup → set
title/description → add song (video) selections → publish**. Reverse-engineered
by observing real traffic; undocumented and subject to change.

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
