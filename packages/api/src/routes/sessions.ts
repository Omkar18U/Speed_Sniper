// packages/api/src/routes/sessions.ts
import { Router } from 'express';
import { store } from '../store/session.store';
import crypto from 'crypto';
import { Session, Difficulty } from '../models/types';
import { getGeminiService } from '../services/gemini.service';
import { buildRound } from '../services/token.factory';
import { validate, CreateSessionSchema } from '../middleware/validation.middleware';
import { sessionService } from '../services/session.service';

const router = Router();

router.post('/', validate(CreateSessionSchema), async (req, res, next) => {
  const { resourceText, fileName, difficulty = 'medium', rounds: roundCount = 10 } = req.body;

  if (Buffer.byteLength(resourceText, 'utf8') > 500 * 1024) {
    return res.status(400).json({ error: { code: 'RESOURCE_TOO_LARGE', message: 'Resource text exceeds 500KB limit' } });
  }

  const sessionId = crypto.randomUUID();

  // Create the session in 'generating' state
  const initialSession: Session = {
    id: sessionId,
    resource: { rawText: resourceText, fileName: fileName || 'upload.txt', summary: '' },
    rounds: [],
    currentRoundIndex: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    status: 'generating',
    difficulty: difficulty as Difficulty,
    createdAt: Date.now(),
    startedAt: null,
    endedAt: null,
    lastActivityAt: Date.now(),
  };
  await store.set(sessionId, initialSession);

  try {
    const gemini = getGeminiService();
    const geminiResponse = await gemini.generateRounds(resourceText, difficulty as Difficulty, roundCount);

    const rounds = geminiResponse.rounds.map((r, i) =>
      buildRound(r, i + 1, sessionId, difficulty as Difficulty)
    );

    const session: Session = {
      ...initialSession,
      resource: {
        rawText: resourceText,
        fileName: fileName || 'upload.txt',
        summary: geminiResponse.resourceSummary,
      },
      rounds,
      status: 'lobby',
      lastActivityAt: Date.now(),
    };

    await store.set(sessionId, session);
    return res.status(201).json({
      sessionId,
      status: session.status,
      resourceSummary: geminiResponse.resourceSummary,
      difficulty: session.difficulty,
      rounds,
    });
  } catch (err: any) {
    // Mark session as error
    const session = await store.get(sessionId);
    if (session) {
      await store.set(sessionId, { ...session, status: 'error' });
    }
    return next(err);
  }
});

router.get('/:id', async (req, res) => {
  const session = await store.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
  }

  return res.json({
    sessionId: session.id,
    status: session.status,
    currentRoundIndex: session.currentRoundIndex,
    score: session.score,
    combo: session.combo,
    hits: session.hits,
    misses: session.misses,
    difficulty: session.difficulty,
  });
});

router.delete('/:id', async (req, res) => {
  if (await store.delete(req.params.id)) {
    res.status(204).send();
  } else {
    res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
  }
});

// Start session (transition from lobby to active)
router.post('/:id/start', async (req, res, next) => {
  try {
    const session = await store.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
    }

    if (session.status === 'active') {
      // Already active, just return success
      return res.status(200).json({
        sessionId: session.id,
        status: session.status,
        currentRoundIndex: session.currentRoundIndex,
      });
    }

    const updatedSession = sessionService.startSession(session);
    await store.set(session.id, updatedSession);

    return res.status(200).json({
      sessionId: updatedSession.id,
      status: updatedSession.status,
      currentRoundIndex: updatedSession.currentRoundIndex,
    });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return next(err);
  }
});

export default router;
