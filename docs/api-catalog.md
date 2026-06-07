# Full API Catalog (v2 discovery)

Reverse-engineered from live traffic on 2026-06-06. Base URL **`https://api.uwufufu.com/v1`**, auth `Authorization: Bearer <token>`. Error shape: `{ message: string | string[], error, statusCode }`.

This extends [endpoints.md](./endpoints.md) (the v1 create-game flow) with everything found during the v2 full-coverage discovery.

## Auth

| Method | Path | Body / Query | Notes |
| ------ | ---- | ------------ | ----- |
| `POST` | `/auth/login` | `{ email, password }` | → `201 { accessToken }` |
| `GET` | `/auth/me` | — | current `User` |

## Browse / discovery (public)

| Method | Path | Query | Response |
| ------ | ---- | ----- | -------- |
| `GET` | `/games` | `page, perPage, sortBy, search, includeNsfw` | `{ page, perPage, total, worldcups: Game[] }` |
| `GET` | `/categories` | — | `Category[]` |
| `GET` | `/selections` | `worldcupId, page, perPage, keyword, sortBy` | `{ page, perPage, total, data: Selection[] }` — public selection list (includes win/loss stats) |

> `sortBy` for selections: `name`, `createdAt`, `winLossRatio`, `finalWinLossRatio`.

## Games (worldcups, owner)

| Method | Path | Body | Notes |
| ------ | ---- | ---- | ----- |
| `POST` | `/games` | `{ title, description, visibility, categoryId, isNsfw }` | create draft → `Game` |
| `GET` | `/games/mine` | `?page, limit` | `{ page, perPage, total, worldcups: Game[] }` |
| `GET` | `/games/:id/mine` | — | `Game` (+ `category`, `selectionCount`) |
| `PUT` | `/games/:id` | full game body | update / publish (`visibility: IS_PUBLIC`) |
| `DELETE` | `/games/:id` | — | → `200` (confirmed; deletes the worldcup) |

## Selections

| Method | Path | Body / Query | Notes |
| ------ | ---- | ------------ | ----- |
| `POST` | `/selections/video` | `{ worldcupId, resourceUrl, startTime, endTime }` | add YouTube selection → `VideoSelection` |
| `GET` | `/selections/mine` | `?worldcupId, page, perPage, keyword, sortBy` | owner list `{ page, perPage, total, data: Selection[] }` |
| `DELETE` | `/selections/:id` | — | → `200` |
| `POST` | `/selections/image` | _multipart (not yet captured)_ | image selection upload — **TODO** |

## Gameplay

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| `POST` | `/started-games` | `{ gameId, roundsOf }` | `{ startedGame, match, matchNumberInRound }` |
| `POST` | `/started-games/pick` | `{ startedGameId, matchId, pickedSelectionId }` | `{ startedGame, previousMatch, match?, matchNumberInRound? }` |
| `GET` | `/started-games` | — | in-progress games for the user |
| `GET` | `/started-games/:id` | — | resume a started game (current match) |

**Flow:** `started-games` begins a run; each `pick` returns the **next** `match`. When the response has **no `match`** and `startedGame.status === "IS_COMPLETED"`, the game is over — the winner is the last `pickedSelectionId`. There is **no separate result/winner endpoint**.

`startedGame.status`: `IN_PROGRESS` | `IS_COMPLETED`.

### `started-games` response (start)

```json
{
  "startedGame": { "id": 17295538, "roundsOf": 4, "status": "IN_PROGRESS" },
  "match": {
    "id": 724694629,
    "roundsOf": 4,
    "selection1": { "id": 11832610, "name": "…", "isVideo": true, "videoSource": "youtube", "videoUrl": "…", "startTime": 0, "endTime": 20, "resourceUrl": "…" },
    "selection2": { "id": 11832611, "name": "…", "…": "…" },
    "winnerId": null
  },
  "matchNumberInRound": 1
}
```

## Not REST endpoints (server-rendered)

These exist as pages but have **no public JSON endpoint** (Next.js App Router SSR/RSC):

- Public single worldcup by `id`/`slug` — `GET /games/:id`, `/games/slug/:slug`, `/worldcups/:slug` all `404`.
- Public user profile — `/users/:id`, `/users/me` `404` (own user only via `/auth/me`).
- Worldcup rankings — `/games/:id/rankings` `404`; rankings come from selection `winLossRatio` / `finalWinLossRatio` (via the selections list).

## Known gaps (not yet captured)

- `POST /selections/image` (+ cover image) — multipart upload.
- Duplicate worldcup (the "duplicate" icon in /my/games).
- Selection edit (`PUT /selections/:id`?) and reorder.
- Auth extras: signup, logout, password reset, OAuth, email verify.
- Comments / likes / report, subscription/plans.
