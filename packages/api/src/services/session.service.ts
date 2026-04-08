// packages/api/src/services/session.service.ts
import { Session, SessionStatus, RoundResult } from '../models/types';
import { store } from '../store/session.store';
import { scoringService } from './scoring.service';

// Valid state transitions
const TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  generating: ['lobby', 'error'],
  lobby: ['active', 'error'],
  active: ['paused', 'complete', 'error'],
  paused: ['active', 'error'],
  complete: [],
  error: [],
};

function canTransition(from: SessionStatus, to: SessionStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export class SessionService {
  async getSession(sessionId: string): Promise<Session | null> {
    return (await store.get(sessionId)) ?? null;
  }

  transition(session: Session, to: SessionStatus): Session {
    if (!canTransition(session.status, to)) {
      const err: any = new Error(`Cannot transition from '${session.status}' to '${to}'`);
      err.code = 'INVALID_STATE_TRANSITION';
      err.status = 409;
      throw err;
    }
    return { ...session, status: to };
  }

  startSession(session: Session): Session {
    const s = this.transition(session, 'active');
    return { ...s, startedAt: Date.now(), currentRoundIndex: 0, lastActivityAt: Date.now() };
  }

  processRoundStart(session: Session): { started: number } {
    // Record when this round's tokens were spawned (used for time bonus)
    return { started: Date.now() };
  }

  processTap(
    session: Session,
    roundId: string,
    selectedAnswer: string,
    tapTimestamp: number,
    roundStartTimestamp?: number
  ): { updatedSession: Session; roundResult: RoundResult; nextRoundIndex: number; gameComplete: boolean } {
    if (session.status !== 'active') {
      const err: any = new Error(`Session is '${session.status}', not active`);
      err.code = 'SESSION_NOT_ACTIVE';
      err.status = 409;
      throw err;
    }

    const round = session.rounds[session.currentRoundIndex];
    if (!round || round.id !== roundId) {
      const err: any = new Error('Round ID does not match current round');
      err.code = 'WRONG_ROUND';
      err.status = 400;
      throw err;
    }

    if (round.result !== null) {
      const err: any = new Error('This round already has a result (duplicate tap)');
      err.code = 'DUPLICATE_ROUND_RESULT';
      err.status = 409;
      throw err;
    }

    const correct = selectedAnswer === round.correctAnswer;
    const timeToTapMs = tapTimestamp && roundStartTimestamp ? tapTimestamp - roundStartTimestamp : null;

    const scoreResult = scoringService.calculate(
      correct,
      tapTimestamp,
      roundStartTimestamp ?? tapTimestamp,
      session,
      round
    );

    const roundResult: RoundResult = {
      roundId: round.id,
      selectedAnswer,
      correct,
      tapTimestamp,
      timeToTapMs,
      scoreDelta: scoreResult.scoreDelta,
      comboAtEnd: scoreResult.newCombo,
      timeBonus: scoreResult.timeBonus,
    };

    // Update session with result
    const updatedRounds = session.rounds.map((r) =>
      r.id === roundId ? { ...r, result: roundResult } : r
    );

    const nextRoundIndex = session.currentRoundIndex + 1;
    const gameComplete = nextRoundIndex >= session.rounds.length;

    let updatedSession: Session = {
      ...session,
      rounds: updatedRounds,
      score: scoreResult.newScore,
      combo: scoreResult.newCombo,
      maxCombo: scoreResult.newMaxCombo,
      hits: scoreResult.newHits,
      misses: scoreResult.newMisses,
      currentRoundIndex: gameComplete ? session.currentRoundIndex : nextRoundIndex,
      status: gameComplete ? 'complete' : 'active',
      endedAt: gameComplete ? Date.now() : null,
      lastActivityAt: Date.now(),
    };

    store.set(session.id, updatedSession);

    return {
      updatedSession,
      roundResult,
      nextRoundIndex,
      gameComplete,
    };
  }

  processMiss(
    session: Session,
    roundId: string
  ): { updatedSession: Session; roundResult: RoundResult; nextRoundIndex: number; gameComplete: boolean } {
    if (session.status !== 'active') {
      const err: any = new Error(`Session is '${session.status}', not active`);
      err.code = 'SESSION_NOT_ACTIVE';
      err.status = 409;
      throw err;
    }

    const round = session.rounds[session.currentRoundIndex];
    if (!round || round.id !== roundId) {
      const err: any = new Error('Round ID does not match current round');
      err.code = 'WRONG_ROUND';
      err.status = 400;
      throw err;
    }

    if (round.result !== null) {
      const err: any = new Error('This round already has a result (duplicate miss)');
      err.code = 'DUPLICATE_ROUND_RESULT';
      err.status = 409;
      throw err;
    }

    const scoreResult = scoringService.calculate(
      false, null, Date.now(), session, round
    );

    const roundResult: RoundResult = {
      roundId: round.id,
      selectedAnswer: null,
      correct: false,
      tapTimestamp: null,
      timeToTapMs: null,
      scoreDelta: 0,
      comboAtEnd: 0,
      timeBonus: false,
    };

    const updatedRounds = session.rounds.map((r) =>
      r.id === roundId ? { ...r, result: roundResult } : r
    );

    const nextRoundIndex = session.currentRoundIndex + 1;
    const gameComplete = nextRoundIndex >= session.rounds.length;

    const updatedSession: Session = {
      ...session,
      rounds: updatedRounds,
      score: scoreResult.newScore,
      combo: 0,
      maxCombo: scoreResult.newMaxCombo,
      hits: scoreResult.newHits,
      misses: scoreResult.newMisses,
      currentRoundIndex: gameComplete ? session.currentRoundIndex : nextRoundIndex,
      status: gameComplete ? 'complete' : 'active',
      endedAt: gameComplete ? Date.now() : null,
      lastActivityAt: Date.now(),
    };

    store.set(session.id, updatedSession);

    return { updatedSession, roundResult, nextRoundIndex, gameComplete };
  }

  pause(session: Session): Session {
    const s = this.transition(session, 'paused');
    const updated = { ...s, lastActivityAt: Date.now() };
    store.set(session.id, updated);
    return updated;
  }

  resume(session: Session): Session {
    const s = this.transition(session, 'active');
    const updated = { ...s, lastActivityAt: Date.now() };
    store.set(session.id, updated);
    return updated;
  }
}

export const sessionService = new SessionService();
