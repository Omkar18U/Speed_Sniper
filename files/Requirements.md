# Requirements.md — Speed Sniper (G3)

## Project Overview

**Speed Sniper** is a standalone, API-first mini-game built with Google Antigravity (web components / vanilla JS). It is extracted from the GameEngine PRD (G3) and exposed as a fully documented REST + WebSocket API so any frontend developer can embed it into their application.

---

## 1. Functional Requirements

### 1.1 Game Mechanics
- 8 answer tokens float/drift across the screen simultaneously
- AI (Gemini) generates **1 correct answer + 7 plausible-but-wrong distractors** from a user-supplied text/PDF resource
- Player taps/clicks the correct token before it drifts off-screen
- Each successful hit increases speed and difficulty for the next round
- A **combo multiplier (×1.5)** activates at 3+ consecutive correct hits
- Game ends after a configurable number of rounds (default: 10 rounds)

### 1.2 Token Behaviour
- Tokens spawn at random Y positions on the right edge and drift left
- Each token has a unique drift speed, slight vertical wobble, and rotation
- Token size decreases as difficulty increases
- Miss = token exits left → round marked incorrect, combo resets
- Hit = token disappears with a burst animation, score updates

### 1.3 AI Content Generation (Gemini)
- Input: raw text extracted from user-uploaded resource (PDF or plain text)
- Output per round: `{ question: string, correct: string, distractors: string[7] }`
- All 10 rounds generated in a single Gemini API call before the game starts
- Distractors must be plausible (same domain, similar length, not obviously wrong)

### 1.4 Scoring
| Event | Points |
|---|---|
| Correct hit | 100 base |
| Combo ×1.5 (3+ streak) | 150 per hit |
| Miss | 0, combo reset |
| Time bonus | +10 pts if tapped in first 25% of token lifetime |
| Max per game | ~1,500 |

### 1.5 Difficulty Progression
| Round | Speed Multiplier | Token Lifetime |
|---|---|---|
| 1–3 | 1.0× | 6 s |
| 4–6 | 1.4× | 4.5 s |
| 7–8 | 1.8× | 3 s |
| 9–10 | 2.2× | 2 s |

---

## 2. API Requirements (Headless / Integrator Mode)

The game must be fully operable via API without any embedded UI. A consuming developer should be able to:

1. **Create a session** — POST resource text, receive `sessionId` + pre-generated question set
2. **Start a round** — GET round data (question + 8 tokens with metadata)
3. **Submit a tap** — POST `{ sessionId, roundId, selectedAnswer, tapTimestamp }`
4. **Receive round result** — score delta, correct flag, combo state, next-round metadata
5. **End / retrieve session** — GET full `SessionResult` with score breakdown

### API is framework-agnostic
- REST endpoints (JSON)
- Optional WebSocket channel for real-time token position sync
- CORS open for any origin (developer-configured)
- API key auth via `X-API-Key` header or query param

---

## 3. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Round data ready < 200 ms after session creation |
| Generation | All 10 rounds generated in < 5 s via Gemini |
| Accessibility | All tokens keyboard-reachable (Tab + Enter fallback) |
| Browser support | Chrome 100+, Firefox 100+, Safari 16+, Edge 100+ |
| Mobile | Touch events supported (touchstart / touchend) |
| Security | Gemini API key stored server-side only, never exposed to client |
| Error handling | Graceful fallback if Gemini fails (static placeholder questions) |

---

## 4. Resource Ingestion Requirements
- Accepted formats: plain text (`.txt`, `.md`), PDF (text-extractable)
- Max size: 10 MB (PDF), 200 KB (plain text)
- Text is chunked into ~2,000-token segments
- First chunk used for Gemini prompt if resource is large
- Resource stored in-session only (no persistence)
