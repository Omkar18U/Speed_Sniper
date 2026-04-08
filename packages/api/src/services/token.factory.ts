// packages/api/src/services/token.factory.ts
import { v4 as uuidv4 } from 'uuid';
import { Round, Token, Difficulty } from '../models/types';

interface GeminiRound {
  question: string;
  correct: string;
  distractors: string[];
}

const SPEED_TABLE = [
  { rounds: [1, 2, 3], speedMultiplier: 1.0, tokenLifetimeMs: 6000 },
  { rounds: [4, 5, 6], speedMultiplier: 1.4, tokenLifetimeMs: 4500 },
  { rounds: [7, 8],    speedMultiplier: 1.8, tokenLifetimeMs: 3000 },
  { rounds: [9, 10],   speedMultiplier: 2.2, tokenLifetimeMs: 2000 },
];

function getRoundPhysics(roundNumber: number): { speedMultiplier: number; tokenLifetimeMs: number } {
  for (const entry of SPEED_TABLE) {
    if (entry.rounds.includes(roundNumber)) {
      return { speedMultiplier: entry.speedMultiplier, tokenLifetimeMs: entry.tokenLifetimeMs };
    }
  }
  return { speedMultiplier: 2.2, tokenLifetimeMs: 2000 };
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildRound(
  geminiRound: GeminiRound,
  roundNumber: number,
  sessionId: string,
  difficulty: Difficulty
): Round {
  const { speedMultiplier, tokenLifetimeMs } = getRoundPhysics(roundNumber);
  const scale = difficulty === 'easy' ? 1.0 : difficulty === 'medium' ? 0.875 : 0.75;
  const baseDriftSpeed = 80 * speedMultiplier;

  const answers = shuffle([
    { text: geminiRound.correct, isCorrect: true },
    ...geminiRound.distractors.map((d) => ({ text: d, isCorrect: false })),
  ]);

  // With 8 tokens, distribute evenly across vertical space (5% to 95%)
  // Each token gets a dedicated lane - NO shuffling of positions to prevent overlap
  const numTokens = answers.length;
  const minY = 5;
  const maxY = 95;
  const laneHeight = (maxY - minY) / numTokens;

  // Assign each token to its own lane with minimal variation
  const tokens: Token[] = answers.map((answer, index) => {
    const laneStart = minY + (index * laneHeight);
    const laneCenter = laneStart + (laneHeight / 2);
    // Very small variation to keep tokens in their lanes
    const spawnY = laneCenter + rand(-1, 1);

    return {
      id: uuidv4(),
      text: answer.text,
      isCorrect: answer.isCorrect,
      spawnY,
      driftSpeedPx: baseDriftSpeed + rand(-15, 15),
      wobbleAmplitude: rand(3, 8), // Reduced wobble to prevent overlap
      wobbleFrequency: rand(0.15, 0.35),
      rotationDeg: rand(-4, 4),
      scale,
    };
  });

  return {
    id: uuidv4(),
    sessionId,
    roundNumber,
    question: geminiRound.question,
    correctAnswer: geminiRound.correct,
    distractors: geminiRound.distractors,
    tokens,
    speedMultiplier,
    tokenLifetimeMs,
    result: null,
  };
}
