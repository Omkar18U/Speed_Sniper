# Phaseco.md — Speed Sniper Development Phases

## Phase Overview

| Phase | Name | Focus | Deliverable |
|---|---|---|---|
| 1 | Foundation | Project setup + API skeleton | Running server with mock data |
| 2 | AI Core | Gemini integration + session logic | Live question generation |
| 3 | Game UI | Antigravity canvas + token animation | Playable game locally |
| 4 | Scoring & State | Full scoring engine + state machine | Complete game loop |
| 5 | API Polish | Headless API hardening + docs | Developer-ready API |
| 6 | Production | Error handling, auth, deploy | Deployed + tested |

---

## Phase 1 — Foundation
**Goal:** Scaffolded project, running Express server, typed schemas, static mock responses.

### Tasks
- [ ] Init monorepo: `api/` (Node + Express + TypeScript) and `ui/` (Antigravity)
- [ ] Define all TypeScript interfaces from Schema.md
- [ ] Implement route stubs: `POST /sessions`, `POST /sessions/:id/tap`, `POST /sessions/:id/miss`, `GET /sessions/:id/result`, `DELETE /sessions/:id`
- [ ] Return hardcoded mock data from all routes
- [ ] Set up in-memory `SessionStore` (Map-based)
- [ ] Add `X-API-Key` middleware (hardcoded key for now)
- [ ] Add global error handler
- [ ] Health check endpoint: `GET /health`
- [ ] Jest test setup — one test per route (mock response)

**Exit Criteria:** All routes return valid mock JSON. `npm test` passes.

---

## Phase 2 — AI Core (Gemini Integration)
**Goal:** Real Gemini-generated questions powering session creation.

### Tasks
- [ ] Implement `GeminiService`
  - [ ] Build prompt template from `resourceText` + `difficulty` + `rounds` count
  - [ ] Call `gemini-1.5-flash` with JSON mode / structured output
  - [ ] Parse and validate `GeminiGenerationResponse`
  - [ ] Retry logic (max 2 retries on failure)
  - [ ] Fallback: if Gemini fails 3×, return static placeholder questions
- [ ] Implement text chunking (max ~2,000 tokens per chunk, use first chunk for prompt)
- [ ] Wire `GeminiService` into `POST /sessions`
- [ ] Generate `Token[]` from each `GeminiRound` (assign spawn positions, drift speeds, wobble params)
- [ ] Store full `Session` in `SessionStore`
- [ ] Test: unit tests for `GeminiService` with mocked Gemini responses
- [ ] Test: integration test for `POST /sessions` with real Gemini call (tagged `@integration`)

**Exit Criteria:** `POST /sessions` with real text returns 10 valid, AI-generated rounds within 8 s.

---

## Phase 3 — Game UI (Google Antigravity)
**Goal:** Visually complete, animated game playable in browser against the live API.

### Tasks
- [ ] Set up Antigravity project in `ui/`
- [ ] Build `<upload-zone>` component
  - [ ] Drag-and-drop + click-to-select
  - [ ] PDF text extraction via PDF.js
  - [ ] File validation (type + size)
  - [ ] Calls `POST /sessions` on upload
- [ ] Build `<game-lobby>` component
  - [ ] Shows resource summary
  - [ ] Difficulty selector
  - [ ] "Start Game" button
- [ ] Build `<game-canvas>` component (core)
  - [ ] Canvas or absolutely-positioned div rendering
  - [ ] Question displayed at top
  - [ ] Token drift animation (requestAnimationFrame loop)
  - [ ] Sine-wave Y wobble per token
  - [ ] Token rotation and scale
  - [ ] Touch + mouse click detection on token
  - [ ] Token exit detection (left edge)
- [ ] Build `<token-sprite>` component
  - [ ] Pill/bubble shape with answer text
  - [ ] Hit animation: burst/expand + fade
  - [ ] Miss animation: fade out
  - [ ] Colour coding: neutral → green (hit) / red (miss) flash
- [ ] Build `<score-hud>` component
  - [ ] Current score, round number (X/10), combo indicator
  - [ ] Progress bar
  - [ ] Pause button
- [ ] Build `<results-panel>` component
  - [ ] Score breakdown table
  - [ ] Play Again + New Resource buttons
- [ ] Wire API client (`api.client.ts`) into all components
- [ ] End-to-end test: upload a .txt file → play full 10-round game

**Exit Criteria:** Full game loop playable in browser. All animations smooth at 60 fps.

---

## Phase 4 — Scoring & State Machine
**Goal:** Correct scoring in all edge cases; complete session state machine.

### Tasks
- [ ] Implement `ScoringService`
  - [ ] Base hit: 100 pts
  - [ ] Combo multiplier: ×1.5 at 3+ streak
  - [ ] Time bonus: +10 if tap in first 25% of `tokenLifetimeMs`
  - [ ] Miss: 0 pts, combo reset
  - [ ] Min score: 0 (never negative)
- [ ] Implement full state machine in `SessionService`
  - [ ] States: `generating → lobby → active → paused → complete → error`
  - [ ] Enforce one result per round (reject duplicate taps)
  - [ ] Auto-complete session after round 10
- [ ] Implement pause / resume (UI + API)
  - [ ] `POST /sessions/:id/pause` and `/resume`
  - [ ] Freeze token animation on pause
- [ ] Session expiry: auto-delete sessions inactive > 30 min
- [ ] Unit tests: ScoringService — all scoring scenarios
- [ ] Unit tests: SessionService state transitions

**Exit Criteria:** All scoring edge cases pass unit tests. Session lifecycle is airtight.

---

## Phase 5 — API Polish (Headless Developer Experience)
**Goal:** The API is clean, documented, and usable by any external developer without the UI.

### Tasks
- [ ] OpenAPI 3.0 spec (`docs/openapi.yaml`) — document all endpoints, schemas, errors
- [ ] Postman collection export
- [ ] Rate limiting middleware (`express-rate-limit`)
  - [ ] 10 req/min on `POST /sessions`
  - [ ] 60 req/min on all other routes
- [ ] CORS configuration (configurable allowed origins)
- [ ] Request validation middleware (`zod` schemas matching `Schema.md`)
- [ ] Structured error responses (all errors use `{ error: { code, message } }`)
- [ ] Logging (`pino`) — request/response logs, Gemini call duration
- [ ] `GET /sessions/:id` for integrators to poll session status
- [ ] API key management: move from hardcoded → env var (`GAME_API_KEY`)
- [ ] Integration tests against all documented error codes
- [ ] Write `Dataapi.md` examples verified against real API responses

**Exit Criteria:** Any developer can follow `Dataapi.md` and build a working integration without reading source code.

---

## Phase 6 — Production Hardening & Deployment
**Goal:** Deployed, secure, monitored, tested.

### Tasks
- [ ] Environment config: `.env.example` with all required vars
  - `GEMINI_API_KEY`, `GAME_API_KEY`, `PORT`, `SESSION_TTL_MINUTES`, `CORS_ORIGINS`
- [ ] Docker: `Dockerfile` for API server, `docker-compose.yml` for local dev
- [ ] Redis adapter for `SessionStore` (optional, behind feature flag)
- [ ] Health check: `GET /health` returns uptime, session count, Gemini status
- [ ] Security audit:
  - [ ] API key never logged
  - [ ] No resource text stored after session delete
  - [ ] Input sanitisation on `resourceText`
- [ ] Load test: simulate 50 concurrent sessions
- [ ] Deploy to target platform (Cloud Run / Railway / Render)
- [ ] CI pipeline: lint → test → build → deploy on merge to main
- [ ] Smoke test post-deploy: automated end-to-end against production URL
- [ ] Write README.md

**Exit Criteria:** Deployed API passes smoke tests. Another developer can integrate in < 30 min using the docs.
