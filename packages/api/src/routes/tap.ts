// packages/api/src/routes/tap.ts
import { Router } from 'express';
import { store } from '../store/session.store';
import { sessionService } from '../services/session.service';
import { validate, TapSchema } from '../middleware/validation.middleware';

const router = Router({ mergeParams: true });

router.post('/', validate(TapSchema), async (req, res, next) => {
  try {
    const session = await store.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
    }

    const { roundId, selectedAnswer, tapTimestamp, roundStartTimestamp } = req.body;

    const { updatedSession, roundResult, nextRoundIndex, gameComplete } = sessionService.processTap(
      session,
      roundId,
      selectedAnswer,
      tapTimestamp ?? Date.now(),
      roundStartTimestamp
    );

    return res.status(200).json({
      roundResult,
      totalScore: updatedSession.score,
      combo: updatedSession.combo,
      hits: updatedSession.hits,
      misses: updatedSession.misses,
      nextRoundIndex,
      roundComplete: true,
      gameComplete,
    });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return next(err);
  }
});

export default router;
