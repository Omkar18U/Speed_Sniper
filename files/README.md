# Speed Sniper — Game API

> G3 from the GameEngine PRD · Action / Reflex mini-game · API-first · Built with Google Antigravity + Gemini AI

---

## What Is This?

**Speed Sniper** is a standalone, API-first educational reflex game. Eight answer tokens drift across the screen; the player must tap the one correct answer before it escapes. Questions are generated in real time from any text or PDF resource using **Google Gemini AI**.

The game is architected as a **headless REST API** first. The Google Antigravity UI is one consumer of that API — but any developer can build their own UI on top of it.

---

## Quick Start (API)

```bash
# 1. Create a session (generates 10 AI rounds from your text)
curl -X POST https://your-domain.com/api/v1/sessions \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{ "resourceText": "Photosynthesis is the process by which...", "difficulty": "medium" }'

# 2. Submit a tap
curl -X POST https://your-domain.com/api/v1/sessions/{sessionId}/tap \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{ "roundId": "...", "selectedAnswer": "ATP", "tapTimestamp": 1718000000000 }'

# 3. Get results
curl https://your-domain.com/api/v1/sessions/{sessionId}/result \
  -H "X-API-Key: your-key"
```

Full API docs → [`Dataapi.md`](./docs/Dataapi.md)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Game UI | Google Antigravity (Web Components) |
| API Server | Node.js + Express + TypeScript |
| AI Generation | Google Gemini 1.5 Flash |
| PDF Extraction | PDF.js (client-side) |
| Testing | Jest + Supertest |
| Deployment | Docker / Cloud Run |

---

## Documentation

| File | Contents |
|---|---|
| [`Requirements.md`](./docs/Requirements.md) | Functional + non-functional requirements |
| [`Appflow.md`](./docs/Appflow.md) | User flows + state machine diagram |
| [`Schema.md`](./docs/Schema.md) | All TypeScript types + API schemas |
| [`Architecture.md`](./docs/Architecture.md) | System design + directory structure |
| [`Dataapi.md`](./docs/Dataapi.md) | Full REST API reference with examples |
| [`Phaseco.md`](./docs/Phaseco.md) | Development phases + task checklists |
| [`Skills.md`](./docs/Skills.md) | Antigravity-specific patterns + conventions |

---

## Environment Variables

```env
GEMINI_API_KEY=your-gemini-key        # Required
GAME_API_KEY=your-game-api-key        # Required (given to integrators)
PORT=3000                             # Default: 3000
SESSION_TTL_MINUTES=30                # Auto-expire inactive sessions
CORS_ORIGINS=*                        # Comma-separated allowed origins
```

---

## Project Structure

```
speed-sniper/
├── api/          # Express API server
├── ui/           # Google Antigravity game UI
├── docs/         # All markdown docs
└── README.md
```

---

## Game Rules (Quick Reference)

- 10 rounds per game
- 8 tokens per round: 1 correct + 7 AI-generated distractors
- Tap the correct token before it drifts off screen
- +100 pts per hit · ×1.5 combo at 3+ streak · +10 time bonus
- Speed and difficulty increase each round
- Max score: ~1,500

---

## Integration for Developers

The entire game runs through the REST API. Your integration checklist:

1. Obtain a `GAME_API_KEY` from the game server owner
2. Call `POST /sessions` with your user's resource text → get `sessionId` + all 10 rounds
3. Render tokens using the `rounds[n].tokens` array (positions, speeds, text included)
4. On tap: `POST /sessions/:id/tap` → get score update
5. On miss (token exits): `POST /sessions/:id/miss`
6. After round 10: `GET /sessions/:id/result` for full breakdown

Full example: [`Dataapi.md`](./docs/Dataapi.md#sdk-usage-example)
