// packages/api/src/services/session.service.spec.ts
import { SessionService } from './session.service';
import { Session, Round, Difficulty } from '../models/types';
import { store } from '../store/session.store';
import crypto from 'crypto';

// Mock the store
jest.mock('../store/session.store', () => ({
  store: { get: jest.fn(), set: jest.fn(), delete: jest.fn(), size: 0 },
}));

const mockRound = (roundNumber = 1): Round => ({
  id: `round-${roundNumber}`,
  sessionId: 'session-1',
  roundNumber,
  question: `Question ${roundNumber}?`,
  correctAnswer: 'Correct',
  distractors: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
  tokens: [],
  speedMultiplier: 1.0,
  tokenLifetimeMs: 6000,
  result: null,
});

const makeTenRounds = () => Array.from({ length: 10 }, (_, i) => mockRound(i + 1));

const baseSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  resource: { rawText: 'test', fileName: 'test.txt', summary: '' },
  rounds: makeTenRounds(),
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

describe('SessionService — State Machine', () => {
  let service: SessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SessionService();
  });

  describe('transition()', () => {
    it('should allow lobby → active', () => {
      const session = baseSession({ status: 'lobby' });
      const s = service.transition(session, 'active');
      expect(s.status).toBe('active');
    });

    it('should allow active → paused', () => {
      const session = baseSession({ status: 'active' });
      const s = service.transition(session, 'paused');
      expect(s.status).toBe('paused');
    });

    it('should allow paused → active', () => {
      const session = baseSession({ status: 'paused' });
      const s = service.transition(session, 'active');
      expect(s.status).toBe('active');
    });

    it('should allow active → complete', () => {
      const session = baseSession({ status: 'active' });
      const s = service.transition(session, 'complete');
      expect(s.status).toBe('complete');
    });

    it('should throw 409 for invalid transition (complete → active)', () => {
      const session = baseSession({ status: 'complete' });
      expect(() => service.transition(session, 'active')).toThrow();
    });

    it('should throw 409 for invalid transition (lobby → complete)', () => {
      const session = baseSession({ status: 'lobby' });
      expect(() => service.transition(session, 'complete')).toThrow();
    });
  });

  describe('processTap()', () => {
    it('should record correct tap and update score/combo/hits', () => {
      const session = baseSession();
      const roundId = session.rounds[0].id;
      const now = Date.now();

      const { updatedSession, roundResult, nextRoundIndex, gameComplete } =
        service.processTap(session, roundId, 'Correct', now + 5000, now);

      expect(roundResult.correct).toBe(true);
      expect(updatedSession.hits).toBe(1);
      expect(updatedSession.combo).toBe(1);
      expect(updatedSession.score).toBeGreaterThan(0);
      expect(nextRoundIndex).toBe(1);
      expect(gameComplete).toBe(false);
    });

    it('should record incorrect tap and reset combo', () => {
      const session = baseSession({ combo: 5 });
      const roundId = session.rounds[0].id;
      const now = Date.now();

      const { updatedSession, roundResult } =
        service.processTap(session, roundId, 'Wrong Answer', now + 5000, now);

      expect(roundResult.correct).toBe(false);
      expect(updatedSession.misses).toBe(1);
      expect(updatedSession.combo).toBe(0);
    });

    it('should auto-complete session on last round', () => {
      const rounds = makeTenRounds();
      const session = baseSession({ rounds, currentRoundIndex: 9 });
      const roundId = rounds[9].id;
      const now = Date.now();

      const { gameComplete, updatedSession } =
        service.processTap(session, roundId, 'Correct', now + 5000, now);

      expect(gameComplete).toBe(true);
      expect(updatedSession.status).toBe('complete');
      expect(updatedSession.endedAt).not.toBeNull();
    });

    it('should throw 409 on duplicate tap', () => {
      const rounds = makeTenRounds();
      rounds[0] = { ...rounds[0], result: {
        roundId: rounds[0].id,
        selectedAnswer: 'Correct',
        correct: true,
        tapTimestamp: Date.now(),
        timeToTapMs: 1000,
        scoreDelta: 100,
        comboAtEnd: 1,
        timeBonus: false,
      }};
      const session = baseSession({ rounds });
      const now = Date.now();

      expect(() => service.processTap(session, rounds[0].id, 'Correct', now, now)).toThrow();
    });

    it('should throw 400 for mismatched roundId', () => {
      const session = baseSession();
      const now = Date.now();
      expect(() => service.processTap(session, 'wrong-id', 'Correct', now, now)).toThrow();
    });

    it('should throw 409 if session is not active', () => {
      const session = baseSession({ status: 'paused' });
      const now = Date.now();
      expect(() => service.processTap(session, session.rounds[0].id, 'Correct', now, now)).toThrow();
    });
  });

  describe('processMiss()', () => {
    it('should record a miss, reset combo, advance round', () => {
      const session = baseSession({ combo: 3 });
      const roundId = session.rounds[0].id;

      const { updatedSession, roundResult, nextRoundIndex } =
        service.processMiss(session, roundId);

      expect(roundResult.correct).toBe(false);
      expect(roundResult.selectedAnswer).toBeNull();
      expect(updatedSession.misses).toBe(1);
      expect(updatedSession.combo).toBe(0);
      expect(nextRoundIndex).toBe(1);
    });

    it('should preserve score on miss', () => {
      const session = baseSession({ score: 500 });
      const roundId = session.rounds[0].id;

      const { updatedSession } = service.processMiss(session, roundId);

      expect(updatedSession.score).toBe(500); // Unchanged
    });
  });

  describe('pause/resume', () => {
    it('should pause an active session', () => {
      const session = baseSession({ status: 'active' });
      const updated = service.pause(session);
      expect(updated.status).toBe('paused');
    });

    it('should resume a paused session', () => {
      const session = baseSession({ status: 'paused' });
      const updated = service.resume(session);
      expect(updated.status).toBe('active');
    });

    it('should throw if pausing a non-active session', () => {
      const session = baseSession({ status: 'complete' });
      expect(() => service.pause(session)).toThrow();
    });

    it('should throw if resuming a non-paused session', () => {
      const session = baseSession({ status: 'active' });
      expect(() => service.resume(session)).toThrow();
    });
  });
});
