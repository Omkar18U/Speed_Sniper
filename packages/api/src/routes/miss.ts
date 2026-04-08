// packages/api/src/routes/miss.ts
import { Router } from 'express';
import { store } from '../store/session.store';
import { sessionService } from '../services/session.service';
import { validate, MissSchema } from '../middleware/validation.middleware';

const router = Router({ mergeParams: true });

router.post('/', validate(MissSchema), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
    }

    const { roundId } = req.body;

    const { updatedSession, roundResult, nextRoundIndex, gameComplete } = sessionService.processMiss(
      session,
      roundId
    );

    return res.status(200).json({
      roundResult,
      totalScore: updatedSession.score,
      combo: 0,
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
