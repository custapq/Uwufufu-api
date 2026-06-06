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

- [ ] 1.1 รวบรวม HAR จาก DevTools → `captures/raw/`
- [ ] 1.2 ระบุ base URL / host, auth (cookie/JWT/token), required headers
- [ ] 1.3 Catalog endpoints (browse, get game, search, play/round, results, ...)
- [ ] 1.4 เก็บ sample request/response ที่ sanitize แล้ว → `captures/samples/`

## Phase 2 — API Modeling & Spec  ·  `phase-2-spec`

- [ ] 2.1 ตาราง endpoint spec (method, path, params, auth)
- [ ] 2.2 TypeScript types/interfaces จาก response จริง
- [ ] 2.3 (option) ร่าง OpenAPI `openapi.yaml`

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
