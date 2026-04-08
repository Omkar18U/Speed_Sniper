// packages/api/src/services/scoring.service.ts
import { Session, Round, RoundResult } from '../models/types';

export interface ScoreCalculationInput {
  selectedAnswer: string | null;
  tapTimestamp: number | null;
  roundStartTimestamp: number;  // When the round tokens were spawned
  session: Session;
  round: Round;
}

export interface ScoreCalculationResult {
  scoreDelta: number;
  newScore: number;
  newCombo: number;
  newMaxCombo: number;
  newHits: number;
  newMisses: number;
  timeBonus: boolean;
  comboMultiplierActive: boolean;
}

const BASE_HIT = 100;
const COMBO_MULTIPLIER = 1.5;
const COMBO_THRESHOLD = 3;        // Activate at 3+ consecutive hits
const TIME_BONUS_PTS = 10;
const TIME_BONUS_WINDOW = 0.25;   // First 25% of tokenLifetimeMs

export class ScoringService {
  calculate(
    correct: boolean,
    tapTimestamp: number | null,
    roundStartTimestamp: number,
    session: Session,
    round: Round
  ): ScoreCalculationResult {
    if (!correct) {
      return {
        scoreDelta: 0,
        newScore: session.score,
        newCombo: 0,
        newMaxCombo: session.maxCombo,
        newHits: session.hits,
        newMisses: session.misses + 1,
        timeBonus: false,
        comboMultiplierActive: false,
      };
    }

    const newCombo = session.combo + 1;
    const comboMultiplierActive = newCombo >= COMBO_THRESHOLD;

    let scoreDelta = BASE_HIT;
    if (comboMultiplierActive) {
      scoreDelta = Math.round(BASE_HIT * COMBO_MULTIPLIER);
    }

    // Time bonus: tap within first 25% of tokenLifetimeMs
    let timeBonus = false;
    if (tapTimestamp !== null) {
      const timeToTap = tapTimestamp - roundStartTimestamp;
      const bonusWindow = round.tokenLifetimeMs * TIME_BONUS_WINDOW;
      if (timeToTap >= 0 && timeToTap <= bonusWindow) {
        scoreDelta += TIME_BONUS_PTS;
        timeBonus = true;
      }
    }

    const newScore = Math.max(0, session.score + scoreDelta);
    const newMaxCombo = Math.max(session.maxCombo, newCombo);

    return {
      scoreDelta,
      newScore,
      newCombo,
      newMaxCombo,
      newHits: session.hits + 1,
      newMisses: session.misses,
      timeBonus,
      comboMultiplierActive,
    };
  }
}

export const scoringService = new ScoringService();
