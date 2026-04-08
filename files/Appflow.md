# Appflow.md — Speed Sniper (G3)

## User-Facing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTRY POINT                              │
│  Developer embeds <speed-sniper> web component OR calls API     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESOURCE UPLOAD SCREEN                       │
│  • Drag-and-drop zone OR programmatic resource injection        │
│  • Accepted: .txt, .md, .pdf                                    │
│  • File validated (type, size)                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ valid file
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI GENERATION (Gemini)                       │
│  • Text extracted from resource                                 │
│  • Single Gemini call: generate 10 rounds of Q + 8 tokens each  │
│  • Loading spinner shown during generation (~3–5 s)             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ generation complete
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GAME LOBBY                                 │
│  • Resource summary shown (1 sentence from Gemini)              │
│  • Difficulty selector: Easy / Medium / Hard                    │
│  • "Start Game" button                                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ player clicks Start
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ROUND LOOP                                │
│                                                                 │
│  ① Question displayed at top of screen                         │
│  ② 8 tokens spawn on right edge, drift left                    │
│  ③ Player taps correct token                                   │
│     • Hit → burst animation, score +, combo check              │
│     • Miss → token exits, round over, combo reset              │
│  ④ Brief result flash (✓ / ✗ + points earned)                  │
│  ⑤ Next round starts (speed increases)                         │
│                                                                 │
│  [Pause button available at all times]                          │
│  [Exit → returns to Lobby with mid-session score saved]        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ after 10 rounds
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RESULTS SCREEN                              │
│  • Final score with breakdown (hits, misses, combo count)       │
│  • Time taken                                                   │
│  • "Play Again" → returns to Lobby (reuses cached questions)    │
│  • "New Resource" → clears session, returns to Upload           │
│  • onGameComplete(SessionResult) callback fired                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Consumer Flow (Headless)

```
Developer App                        Speed Sniper API
     │                                      │
     │── POST /sessions ──────────────────► │  { resourceText }
     │◄─────────────────────────────────── │  { sessionId, rounds[10] }
     │                                      │
     │── GET /sessions/:id/round/1 ────────► │
     │◄─────────────────────────────────── │  { question, tokens[8], roundId }
     │                                      │
     │  [Render tokens in own UI]           │
     │                                      │
     │── POST /sessions/:id/tap ───────────► │  { roundId, answer, tapTimestamp }
     │◄─────────────────────────────────── │  { correct, scoreDelta, combo, nextRound }
     │                                      │
     │  [Repeat for rounds 2–10]            │
     │                                      │
     │── GET /sessions/:id/result ─────────► │
     │◄─────────────────────────────────── │  { SessionResult }
```

---

## State Machine

```
[IDLE] ──upload──► [VALIDATING] ──pass──► [GENERATING] ──done──► [LOBBY]
                         │                                          │
                       fail                                       start
                         │                                          ▼
                    [ERROR_STATE]                              [IN_ROUND]
                                                                   │
                                                            hit/miss+next
                                                                   │
                                                            [ROUND_RESULT]
                                                                   │
                                                       10 rounds complete
                                                                   │
                                                            [GAME_OVER]
```
