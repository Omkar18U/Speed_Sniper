// packages/api/src/routes/result.ts
import { Router } from 'express';
import { store } from '../store/session.store';
import { SessionResult } from '../models/types';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { id } = req.params as { id: string };
  const session = await store.get(id);
  if (!session) {
    return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
  }

  if (session.status !== 'complete') {
    return res.status(409).json({
      error: { code: 'SESSION_NOT_COMPLETE', message: `Session is '${session.status}', not complete` }
    });
  }

  const durationMs =
    session.startedAt && session.endedAt ? session.endedAt - session.startedAt : 0;

  const roundBreakdown = session.rounds
    .map((r) => r.result)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const totalRounds = session.rounds.length;
  const accuracy = totalRounds > 0 ? session.hits / totalRounds : 0;

  const result: SessionResult = {
    sessionId: session.id,
    totalScore: session.score,
    hits: session.hits,
    misses: session.misses,
    maxCombo: session.maxCombo,
    accuracy,
    durationMs,
    roundBreakdown,
    difficulty: session.difficulty,
    resourceSummary: session.resource.summary,
  };

  return res.json(result);
});

export default router;
