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

- [ ] 6.1 API Reference ครบทุก endpoint ใน README
- [ ] 6.2 Quickstart + Auth guide + ตัวอย่าง
- [ ] 6.3 Disclaimer + rate-limit notes
