// packages/api/src/models/types.ts

export type SessionStatus = 'generating' | 'lobby' | 'active' | 'paused' | 'complete' | 'error';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Token {
  id: string;
  text: string;
  isCorrect: boolean;
  spawnY: number;           // % of canvas height (0–100)
  driftSpeedPx: number;     // px/sec
  wobbleAmplitude: number;  // px
  wobbleFrequency: number;  // Hz
  rotationDeg: number;      // -8 to +8
  scale: number;            // 1.0 at easy → 0.75 at hard
}

export interface Round {
  id: string;
  sessionId: string;
  roundNumber: number;      // 1–10
  question: string;
  correctAnswer: string;
  distractors: string[];    // exactly 7
  tokens: Token[];          // exactly 8 (shuffled)
  speedMultiplier: number;
  tokenLifetimeMs: number;
  result: RoundResult | null;
}

export interface RoundResult {
  roundId: string;
  selectedAnswer: string | null;
  correct: boolean;
  tapTimestamp: number | null;
  timeToTapMs: number | null;
  scoreDelta: number;
  comboAtEnd: number;
  timeBonus: boolean;
}

export interface Session {
  id: string;
  resource: { rawText: string; fileName: string; summary: string };
  rounds: Round[];
  currentRoundIndex: number;
  score: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  status: SessionStatus;
  difficulty: Difficulty;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  lastActivityAt: number;
}

export interface SessionResult {
  sessionId: string;
  totalScore: number;
  hits: number;
  misses: number;
  maxCombo: number;
  accuracy: number;
  durationMs: number;
  roundBreakdown: RoundResult[];
  difficulty: Difficulty;
  resourceSummary: string;
}

export interface GeminiGenerationResponse {
  resourceSummary: string;
  rounds: { question: string; correct: string; distractors: string[] }[];
}
