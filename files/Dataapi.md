# Dataapi.md — Speed Sniper Game API

**Base URL:** `https://your-domain.com/api/v1`  
**Auth:** `X-API-Key: <your-key>` header on all requests  
**Content-Type:** `application/json`

---

## Endpoints

---

### `POST /sessions`
Create a new game session. Triggers Gemini AI generation of all 10 rounds.

**Request Body**
```json
{
  "resourceText": "string",        // Required. Extracted text from PDF/txt
  "fileName": "string",            // Optional. Original file name for display
  "difficulty": "easy|medium|hard",// Optional. Default: "medium"
  "rounds": 10                     // Optional. Default: 10, max: 20
}
```

**Response `201 Created`**
```json
{
  "sessionId": "a1b2c3d4-...",
  "status": "lobby",
  "resourceSummary": "This document covers the fundamentals of photosynthesis...",
  "difficulty": "medium",
  "rounds": [
    {
      "id": "round-uuid",
      "roundNumber": 1,
      "question": "Which molecule is produced during the light reactions?",
      "tokens": [
        { "id": "t1", "text": "ATP", "isCorrect": true,  "spawnY": 240, "driftSpeedPx": 80, "wobbleAmplitude": 12, "wobbleFrequency": 0.4, "rotationDeg": -3, "scale": 1.0 },
        { "id": "t2", "text": "ADP", "isCorrect": false, "spawnY": 410, "driftSpeedPx": 95, ... },
        // ... 6 more tokens
      ],
      "speedMultiplier": 1.0,
      "tokenLifetimeMs": 6000
    }
    // ... 9 more rounds
  ]
}
```

**Errors**
| Code | Meaning |
|---|---|
| `400 MISSING_RESOURCE_TEXT` | resourceText not provided |
| `400 RESOURCE_TOO_LARGE` | Text exceeds 200 KB |
| `503 GENERATION_FAILED` | Gemini API error after retries |

---

### `GET /sessions/:sessionId`
Retrieve current session state.

**Response `200 OK`**
```json
{
  "sessionId": "...",
  "status": "active",
  "currentRoundIndex": 2,
  "score": 300,
  "combo": 2,
  "hits": 2,
  "misses": 0,
  "difficulty": "medium"
}
```

---

### `POST /sessions/:sessionId/tap`
Submit a player's tap (answer selection) for the current round.

**Request Body**
```json
{
  "roundId": "round-uuid",
  "selectedAnswer": "ATP",
  "tapTimestamp": 1718000005321
}
```

**Response `200 OK`**
```json
{
  "correct": true,
  "scoreDelta": 150,
  "totalScore": 450,
  "combo": 3,
  "timeBonus": true,
  "comboMultiplierActive": true,
  "roundComplete": true,
  "nextRoundIndex": 3,
  "gameComplete": false
}
```

**Errors**
| Code | Meaning |
|---|---|
| `404 SESSION_NOT_FOUND` | Invalid sessionId |
| `409 ROUND_ALREADY_PLAYED` | roundId already has a result |
| `422 INVALID_ANSWER` | selectedAnswer not in token list |

---

### `POST /sessions/:sessionId/miss`
Submit when the correct token drifts off screen (player missed).

**Request Body**
```json
{
  "roundId": "round-uuid"
}
```

**Response `200 OK`**
```json
{
  "correct": false,
  "scoreDelta": 0,
  "totalScore": 300,
  "combo": 0,
  "comboReset": true,
  "roundComplete": true,
  "nextRoundIndex": 3,
  "gameComplete": false
}
```

---

### `GET /sessions/:sessionId/result`
Retrieve the full session result. Only available when `status === 'complete'`.

**Response `200 OK`**
```json
{
  "sessionId": "...",
  "totalScore": 1100,
  "hits": 8,
  "misses": 2,
  "maxCombo": 5,
  "accuracy": 0.8,
  "durationMs": 87400,
  "difficulty": "medium",
  "resourceSummary": "...",
  "roundBreakdown": [
    {
      "roundId": "...",
      "roundNumber": 1,
      "question": "Which molecule...",
      "correctAnswer": "ATP",
      "selectedAnswer": "ATP",
      "correct": true,
      "tapTimestamp": 1718000005321,
      "timeToTapMs": 1821,
      "scoreDelta": 100,
      "comboAtEnd": 1,
      "timeBonus": false
    }
    // ...
  ]
}
```

---

### `DELETE /sessions/:sessionId`
End and clear a session early.

**Response `204 No Content`**

---

## WebSocket (Optional — Phase 2)

Connect for real-time server-side token timing validation.

```
ws://your-domain.com/ws/sessions/:sessionId
```

**Server → Client messages**
```json
{ "type": "TOKEN_EXPIRED", "tokenId": "t3", "roundId": "round-uuid" }
{ "type": "ROUND_TIMEOUT", "roundId": "round-uuid" }
```

**Client → Server messages**
```json
{ "type": "TAP", "tokenId": "t1", "roundId": "round-uuid", "timestamp": 1718000005321 }
```

---

## Rate Limits

| Endpoint | Limit |
|---|---|
| `POST /sessions` | 10 req / min per API key |
| All other endpoints | 60 req / min per API key |

---

## SDK Usage Example (JavaScript)

```javascript
// Create session
const session = await fetch('/api/v1/sessions', {
  method: 'POST',
  headers: { 'X-API-Key': 'your-key', 'Content-Type': 'application/json' },
  body: JSON.stringify({ resourceText: myText, difficulty: 'medium' })
}).then(r => r.json());

// Submit tap
const result = await fetch(`/api/v1/sessions/${session.sessionId}/tap`, {
  method: 'POST',
  headers: { 'X-API-Key': 'your-key', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roundId: session.rounds[0].id,
    selectedAnswer: 'ATP',
    tapTimestamp: Date.now()
  })
}).then(r => r.json());
```
