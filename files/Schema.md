# Schema.md — Speed Sniper (G3)

## Core Data Types (TypeScript)

---

### Resource

```typescript
interface Resource {
  id: string;              // UUID
  rawText: string;         // Extracted text content
  fileName: string;        // Original file name
  fileType: 'pdf' | 'txt' | 'md';
  sizeBytes: number;
  uploadedAt: number;      // Unix ms timestamp
  summary: string;         // 1-sentence Gemini-generated summary
}
```

---

### Session

```typescript
interface Session {
  id: string;                    // UUID
  resource: Resource;
  rounds: Round[];               // Always 10
  currentRoundIndex: number;     // 0-based
  score: number;
  combo: number;                 // Current consecutive hit streak
  maxCombo: number;
  hits: number;
  misses: number;
  status: SessionStatus;
  difficulty: Difficulty;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
}

type SessionStatus = 'generating' | 'lobby' | 'active' | 'paused' | 'complete' | 'error';
type Difficulty = 'easy' | 'medium' | 'hard';
```

---

### Round

```typescript
interface Round {
  id: string;               // UUID
  sessionId: string;
  roundNumber: number;      // 1–10
  question: string;         // e.g. "Which of these is the correct definition of X?"
  correctAnswer: string;
  distractors: string[];    // Always 7 items
  tokens: Token[];          // 8 tokens = correct + 7 distractors (shuffled)
  speedMultiplier: number;  // 1.0 – 2.2
  tokenLifetimeMs: number;  // How long each token lives on screen
  result: RoundResult | null;
}
```

---

### Token

```typescript
interface Token {
  id: string;
  text: string;
  isCorrect: boolean;
  spawnX: number;           // Always right edge (e.g. canvas width)
  spawnY: number;           // Random 10%–90% of canvas height
  driftSpeedPx: number;     // Pixels per second leftward
  wobbleAmplitude: number;  // Vertical sine wave amplitude in px
  wobbleFrequency: number;  // Hz
  rotationDeg: number;      // Slight tilt (-8 to +8 deg)
  scale: number;            // 1.0 at easy, 0.75 at hard
}
```

---

### RoundResult

```typescript
interface RoundResult {
  roundId: string;
  selectedAnswer: string | null;   // null if token exited (miss)
  correct: boolean;
  tapTimestamp: number | null;     // Unix ms, null on miss
  timeToTapMs: number | null;      // ms from spawn to tap
  scoreDelta: number;
  comboAtEnd: number;
  timeBonus: boolean;              // True if tapped in first 25% of lifetime
}
```

---

### SessionResult

```typescript
interface SessionResult {
  sessionId: string;
  totalScore: number;
  hits: number;
  misses: number;
  maxCombo: number;
  accuracy: number;           // hits / (hits + misses) as 0–1
  durationMs: number;
  roundBreakdown: RoundResult[];
  difficulty: Difficulty;
  resourceSummary: string;
}
```

---

### Gemini Prompt Response Schema

```typescript
// What Gemini must return (JSON mode)
interface GeminiGenerationResponse {
  resourceSummary: string;
  rounds: GeminiRound[];    // Exactly 10
}

interface GeminiRound {
  question: string;
  correct: string;
  distractors: string[];    // Exactly 7
}
```

---

## API Request / Response Schemas

### POST /sessions

**Request**
```json
{
  "resourceText": "string (required, max 200KB)",
  "difficulty": "easy | medium | hard (default: medium)",
  "rounds": "number (default: 10, max: 20)"
}
```

**Response 201**
```json
{
  "sessionId": "uuid",
  "status": "generating | lobby",
  "resourceSummary": "string",
  "rounds": [ /* Round[] */ ]
}
```

---

### POST /sessions/:id/tap

**Request**
```json
{
  "roundId": "uuid",
  "selectedAnswer": "string",
  "tapTimestamp": 1718000000000
}
```

**Response 200**
```json
{
  "correct": true,
  "scoreDelta": 150,
  "totalScore": 450,
  "combo": 3,
  "timeBonus": true,
  "roundComplete": true,
  "nextRoundIndex": 3
}
```

---

### GET /sessions/:id/result

**Response 200**
```json
{
  "sessionId": "uuid",
  "totalScore": 1100,
  "hits": 8,
  "misses": 2,
  "maxCombo": 5,
  "accuracy": 0.8,
  "durationMs": 87000,
  "roundBreakdown": [ /* RoundResult[] */ ],
  "difficulty": "medium",
  "resourceSummary": "string"
}
```

---

## Error Schema

```json
{
  "error": {
    "code": "INVALID_FILE_TYPE | FILE_TOO_LARGE | GENERATION_FAILED | SESSION_NOT_FOUND | ROUND_ALREADY_PLAYED",
    "message": "Human-readable description",
    "details": {}
  }
}
```
