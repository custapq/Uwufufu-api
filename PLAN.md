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

- [ ] 3.1 HTTP client base (fetch wrapper + config)
- [ ] 3.2 Auth handling + typed errors
- [ ] 3.3 Rate-limit / retry helper
- [ ] 3.4 `createClient()` entry point + type exports

## Phase 4 — Feature Coverage  ·  `phase-4-features`

- [ ] 4.1 Games module (list / get / search)
- [ ] 4.2 Gameplay module (rounds / choices / results)
- [ ] 4.3 Pagination helpers
- [ ] 4.4 ครอบ endpoints ที่เหลือ

## Phase 5 — Testing & Examples  ·  `phase-5-tests`

- [ ] 5.1 Unit tests (mock HTTP)
- [ ] 5.2 Smoke/integration test (optional, gated)
- [ ] 5.3 Example scripts ใน `examples/`

## Phase 6 — Documentation  ·  `phase-6-docs`

- [ ] 6.1 API Reference ครบทุก endpoint ใน README
- [ ] 6.2 Quickstart + Auth guide + ตัวอย่าง
- [ ] 6.3 Disclaimer + rate-limit notes
