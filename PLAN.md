# Implementation Plan — uwufufu-api

Unofficial TypeScript/Node.js SDK + API docs, reverse-engineered from uwufufu.com.

## Workflow

แต่ละ phase ทำงานบน branch แยก (`phase-<n>-<slug>`) ทำทีละ task → รีวิว → รอ approval → commit
จบ phase แล้วจึงไป phase ถัดไป

---

## Phase 0 — Project Setup & Tooling  ·  `phase-0-setup`

- [x] 0.1 `git init` + `.gitignore`
- [x] 0.2 Node/TS scaffold (`package.json`, `tsconfig.json`, `tsup`)
- [x] 0.3 Tooling: ESLint + Prettier + Vitest
- [x] 0.4 โครงโฟลเดอร์ (`src/`, `docs/`, `examples/`, `captures/`, `test/`)
- [x] 0.5 README skeleton + `PLAN.md` + CLAUDE files (gitignored)

## Phase 1 — API Reconnaissance (แกะ API)  ·  `phase-1-recon`

> Scope โฟกัส: **create-game (video) flow** — login → create → set title/desc → add song → publish

- [x] 1.1 ดักจับ traffic ผ่าน Claude-in-Chrome (fetch interceptor, ไม่ใช้ HAR)
- [x] 1.2 ระบุ base URL (`https://api.uwufufu.com/v1`) + auth (`Bearer accessToken`) → [docs/auth.md](docs/auth.md)
- [x] 1.3 Catalog endpoints ของ create-game flow → [docs/endpoints.md](docs/endpoints.md)
- [x] 1.4 เก็บ sanitized samples → [captures/samples/create-game-flow.json](captures/samples/create-game-flow.json)

## Phase 2 — API Modeling & Spec  ·  `phase-2-spec`

- [x] 2.1 ตาราง endpoint spec → [docs/endpoints.md](docs/endpoints.md) (จาก Phase 1)
- [x] 2.2 TypeScript types/interfaces → [src/types.ts](src/types.ts) (export ผ่าน index)
- [x] 2.3 OpenAPI spec → [docs/openapi.yaml](docs/openapi.yaml) (8 paths, 12 schemas)

## Phase 3 — Core SDK  ·  `phase-3-core`

- [x] 3.1 HTTP client base → [src/http.ts](src/http.ts) (fetch wrapper + config)
- [x] 3.2 Auth handling + typed errors → [src/errors.ts](src/errors.ts) (`UwufufuApiError`)
- [x] 3.3 Retry helper (429/5xx + Retry-After + backoff) ใน [src/http.ts](src/http.ts)
- [x] 3.4 `createClient()` → [src/client.ts](src/client.ts) + exports ใน index

## Phase 4 — Feature Coverage  ·  `phase-4-features`

> Scope โฟกัส: create-game (video) flow

- [x] 4.1 Games resource → [src/resources/games.ts](src/resources/games.ts) (create/getMine/listMine/update/replace/publish)
- [x] 4.2 Selections resource → [src/resources/selections.ts](src/resources/selections.ts) (addVideo)
- [x] 4.3 Pagination type `WorldcupPage` + `listMine({page, limit})`
- [x] 4.4 wire resources เข้า `UwufufuClient` (`client.games`, `client.selections`)

## Phase 5 — Testing & Examples  ·  `phase-5-tests`

- [x] 5.1 Unit tests (mock HTTP) → [test/](test) — 22 tests (http/client/games/selections)
- [x] 5.2 Gated live integration test → [test/integration.test.ts](test/integration.test.ts) (skip ถ้าไม่มี `UWUFUFU_TOKEN`)
- [x] 5.3 Example script → [examples/create-video-game.ts](examples/create-video-game.ts) (`npm run example`)

## Phase 6 — Documentation  ·  `phase-6-docs`

- [x] 6.1 API Reference ครบทุก endpoint + enums ใน [README.md](README.md)
- [x] 6.2 Quickstart + Auth guide + ตัวอย่าง SDK เต็ม flow
- [x] 6.3 Disclaimer + rate-limit/retry notes + คำเตือน publish + observed quirks

---

# Plan v2 — Full API Coverage

เป้าหมาย: ครอบ API ทั้งหมดเท่าที่หาได้ ต่อยอดจาก v1 (create-game flow)

**Decisions:**
- Destructive endpoints (delete ฯลฯ): สร้าง test data เองแล้วลบ — ไม่แตะของจริง
- การเดินดัก: Claude ขับ browser เอง (auth-sensitive เช่น signup/reset ให้ผู้ใช้กด, Claude ดัก response)
- ไม่ยิงรัว เคารพ rate limit

## Phase A — Full Endpoint Discovery  ·  `phase-a-discovery`

- [ ] A.1 วาง capture harness ถาวร (sessionStorage interceptor, log ทุก api.uwufufu.com)
- [ ] A.2 เดินทุก flow ดักจับ: browse/search, public game, **gameplay (start/vote/result)**, rankings/stats, image selection + upload, manage (edit/delete/duplicate/visibility), media upload (cover), auth extras (signup/logout/reset/oauth — observe), user/profile, comments/likes, subscription
- [ ] A.3 Bundle string-mining — ดึง `/v1/...` จาก JS chunks เป็น cross-check
- [ ] A.4 Master endpoint catalog (method/path/auth/params/shape) + sanitized samples

## Phase B — Modeling  ·  `phase-b-spec`

- [ ] B.1 ขยาย `src/types.ts` ครอบ entity/request ใหม่
- [ ] B.2 ขยาย `docs/openapi.yaml` ครบทุก endpoint

## Phase C — SDK Resources  ·  `phase-c-resources`

- [ ] C.1 `gameplay` (start / getMatch / vote / result)
- [ ] C.2 `rankings` + stats
- [ ] C.3 `users` (me / profile / public)
- [ ] C.4 `media` upload (cover / selection image) + `selections` image/list/update/delete
- [ ] C.5 `games` browse/get(public)/delete/duplicate
- [ ] C.6 auth extras (signup/logout/reset ตามที่ดักได้)

## Phase D — Tests  ·  `phase-d-tests`

- [ ] D.1 Unit tests (mock) ทุก resource ใหม่
- [ ] D.2 ขยาย gated integration test

## Phase E — Docs  ·  `phase-e-docs`

- [ ] E.1 อัปเดต README ครบทุก resource
- [ ] E.2 อัปเดต docs/endpoints.md ครบทุก endpoint
