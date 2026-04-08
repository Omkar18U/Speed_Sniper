// packages/api/src/services/scoring.service.spec.ts
import { ScoringService } from './scoring.service';
import { Session, Round, Difficulty } from '../models/types';

const mockRound = (lifetimeMs = 6000): Round => ({
  id: 'round-1',
  sessionId: 'session-1',
  roundNumber: 1,
  question: 'What is X?',
  correctAnswer: 'Answer X',
  distractors: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
  tokens: [],
  speedMultiplier: 1.0,
  tokenLifetimeMs: lifetimeMs,
  result: null,
});

const mockSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  resource: { rawText: '', fileName: 'test.txt', summary: '' },
  rounds: [],
  currentRoundIndex: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  hits: 0,
  misses: 0,
  status: 'active',
  difficulty: 'medium' as Difficulty,
  createdAt: Date.now(),
  startedAt: Date.now(),
  endedAt: null,
  lastActivityAt: Date.now(),
  ...overrides,
});

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  describe('Correct tap', () => {
    it('should award 100 base points for a correct tap', () => {
      const session = mockSession();
      const round = mockRound();
      const now = Date.now();

      const result = service.calculate(true, now + 5000, now, session, round);

      expect(result.scoreDelta).toBe(100);
      expect(result.newScore).toBe(100);
      expect(result.newHits).toBe(1);
      expect(result.newMisses).toBe(0);
      expect(result.newCombo).toBe(1);
    });

    it('should award time bonus (+10) when tap is within first 25% of lifetime', () => {
      const session = mockSession();
      const round = mockRound(6000);
      const now = Date.now();

      // Tap at 1000ms = 16.6% — within first 25% window
      const result = service.calculate(true, now + 1000, now, session, round);

      expect(result.timeBonus).toBe(true);
      expect(result.scoreDelta).toBe(110); // 100 + 10
    });

    it('should NOT award time bonus when tap is after 25% of lifetime', () => {
      const session = mockSession();
      const round = mockRound(6000);
      const now = Date.now();

      // 25% of 6000ms = 1500ms. Tap at 2000ms > 1500ms
      const result = service.calculate(true, now + 2000, now, session, round);

      expect(result.timeBonus).toBe(false);
      expect(result.scoreDelta).toBe(100);
    });

    it('should apply 1.5× combo multiplier at 3+ streak (round up)', () => {
      const session = mockSession({ combo: 2 }); // Next tap will be 3rd in streak
      const round = mockRound();
      const now = Date.now();

      const result = service.calculate(true, now + 5000, now, session, round);

      expect(result.comboMultiplierActive).toBe(true);
      expect(result.scoreDelta).toBe(150); // Math.round(100 * 1.5)
      expect(result.newCombo).toBe(3);
    });

    it('should stack time bonus on top of combo multiplier', () => {
      const session = mockSession({ combo: 2 }); // Will be 3rd hit
      const round = mockRound(6000);
      const now = Date.now();

      const result = service.calculate(true, now + 500, now, session, round);

      expect(result.comboMultiplierActive).toBe(true);
      expect(result.timeBonus).toBe(true);
      expect(result.scoreDelta).toBe(160); // 150 + 10
    });

    it('should accumulate score correctly', () => {
      const session = mockSession({ score: 250, combo: 5 });
      const round = mockRound();
      const now = Date.now();

      const result = service.calculate(true, now + 5000, now, session, round);

      expect(result.newScore).toBe(250 + 150); // 250 + (100 * 1.5)
    });

    it('should track maxCombo correctly', () => {
      const session = mockSession({ combo: 5, maxCombo: 5 });
      const round = mockRound();
      const now = Date.now();

      const result = service.calculate(true, now + 5000, now, session, round);

      expect(result.newCombo).toBe(6);
      expect(result.newMaxCombo).toBe(6);
    });
  });

  describe('Incorrect tap / miss', () => {
    it('should award 0 points for a miss', () => {
      const session = mockSession({ score: 500, combo: 5 });
      const round = mockRound();

      const result = service.calculate(false, null, Date.now(), session, round);

      expect(result.scoreDelta).toBe(0);
      expect(result.newScore).toBe(500); // Score unchanged
      expect(result.newCombo).toBe(0);   // Combo reset
      expect(result.newMisses).toBe(1);
      expect(result.timeBonus).toBe(false);
    });

    it('should never produce a negative score', () => {
      const session = mockSession({ score: 0 });
      const round = mockRound();

      const result = service.calculate(false, null, Date.now(), session, round);

      expect(result.newScore).toBeGreaterThanOrEqual(0);
    });

    it('should preserve maxCombo on miss', () => {
      const session = mockSession({ combo: 5, maxCombo: 10 });
      const round = mockRound();

      const result = service.calculate(false, null, Date.now(), session, round);

      expect(result.newCombo).toBe(0);
      expect(result.newMaxCombo).toBe(10); // Preserved
    });
  });
});
