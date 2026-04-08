# Architecture.md — Speed Sniper (G3)

## System Overview

Speed Sniper is split into two layers:

1. **Game API Server** — Node.js/Express backend. Handles resource ingestion, Gemini AI generation, session management, and scoring logic. The Gemini API key lives only here.
2. **Game UI** — Built with **Google Antigravity** (web components). Consumes the Game API. Can be swapped out by any other frontend.

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Speed Sniper UI (Google Antigravity)         │    │
│  │  - Web Components: <upload-zone>, <game-canvas>,    │    │
│  │    <score-hud>, <token-sprite>, <results-panel>     │    │
│  │  - Canvas / CSS animation for token drift           │    │
│  │  - Calls Game API over HTTP                         │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │ REST / WS                          │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────┐
│                  GAME API SERVER (Node / Express)            │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Routes     │  │  Session     │  │  Scoring Engine  │   │
│  │  /sessions  │  │  Store       │  │  - Hit/miss calc │   │
│  │  /tap       │  │  (in-memory  │  │  - Combo logic   │   │
│  │  /result    │  │   Map / Redis│  │  - Time bonus    │   │
│  └──────┬──────┘  └──────────────┘  └──────────────────┘   │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────────┐    │
│  │              Gemini Service                          │    │
│  │  - Text chunking                                     │    │
│  │  - Prompt construction                               │    │
│  │  - JSON response parsing + validation               │    │
│  │  - Retry on failure (max 2 retries)                 │    │
│  └──────┬───────────────────────────────────────────────┘   │
└─────────┼────────────────────────────────────────────────────┘
          │ HTTPS
┌─────────▼───────────┐
│   Google Gemini API  │
│  (gemini-1.5-flash)  │
└─────────────────────┘
```

---

## Directory Structure

```
speed-sniper/
├── api/                          # Game API Server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── sessions.ts       # POST /sessions, GET /sessions/:id
│   │   │   ├── tap.ts            # POST /sessions/:id/tap
│   │   │   └── result.ts         # GET /sessions/:id/result
│   │   ├── services/
│   │   │   ├── gemini.service.ts # Gemini API integration
│   │   │   ├── session.service.ts
│   │   │   └── scoring.service.ts
│   │   ├── models/               # TypeScript interfaces (Schema.md)
│   │   ├── middleware/
│   │   │   ├── auth.ts           # X-API-Key validation
│   │   │   └── errorHandler.ts
│   │   └── index.ts              # Express app entry
│   ├── package.json
│   └── tsconfig.json
│
├── ui/                           # Google Antigravity UI
│   ├── components/
│   │   ├── upload-zone/
│   │   ├── game-canvas/
│   │   ├── token-sprite/
│   │   ├── score-hud/
│   │   └── results-panel/
│   ├── services/
│   │   └── api.client.ts         # Typed wrapper around Game API
│   ├── utils/
│   │   ├── animation.ts          # Token drift / physics
│   │   └── pdf-extract.ts        # PDF.js text extraction
│   └── index.ts
│
├── docs/                         # All .md files live here
└── README.md
```

---

## Key Architectural Decisions

### 1. Gemini API Key on Server Only
The Gemini API key is **never sent to the browser**. All AI calls go through the Game API server. This is mandatory for the headless API use-case where other developers integrate without knowing (or needing) the key.

### 2. Session Storage — In-Memory (Phase 1), Redis (Phase 2)
- Phase 1: JavaScript `Map` in-process. Sessions expire after 30 min of inactivity.
- Phase 2: Redis for multi-instance deployments.

### 3. All 10 Rounds Generated Upfront
One Gemini call at session creation generates all 10 rounds. This avoids per-round latency during gameplay. Rounds are stored in the session and served on demand.

### 4. Headless-First API Design
The UI is a consumer of the API, not tightly coupled to it. Any developer can implement their own UI by calling the same REST endpoints.

### 5. Google Antigravity for UI
Antigravity web components provide the rendering layer. Token animation uses the canvas or CSS transforms managed by the `<game-canvas>` component. This keeps the UI framework-agnostic at the embedding level.

---

## Data Flow — Session Creation

```
1. Client uploads file → extracts text (PDF.js on client or multipart on server)
2. POST /sessions { resourceText, difficulty }
3. Server: validate text → chunk → build Gemini prompt
4. Gemini call → parse 10 rounds JSON
5. Store Session in SessionStore
6. Return sessionId + rounds to client
7. Client enters Lobby state
```

## Data Flow — Round Play

```
1. Client renders tokens from round.tokens[]
2. Token animation loop runs (drift left, wobble)
3. Player taps token → POST /sessions/:id/tap { roundId, selectedAnswer, tapTimestamp }
4. Server: validate tap, calculate score, update session
5. Return RoundResult → client animates hit/miss
6. Client advances to next round
```
