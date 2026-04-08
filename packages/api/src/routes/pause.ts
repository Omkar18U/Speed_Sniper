// packages/api/src/routes/pause.ts
import { Router } from 'express';
import { store } from '../store/session.store';
import { sessionService } from '../services/session.service';

const router = Router({ mergeParams: true });

router.post('/pause', async (req, res) => {
  const { id } = req.params as { id: string };
  const session = await store.get(id);
  if (!session) {
    return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
  }

  try {
    const updated = sessionService.pause(session);
    await store.set(session.id, updated);
    return res.json({ sessionId: session.id, status: updated.status });
  } catch (err: any) {
    return res.status(err.status || 409).json({ error: { code: err.code, message: err.message } });
  }
});

router.post('/resume', async (req, res) => {
  const { id } = req.params as { id: string };
  const session = await store.get(id);
  if (!session) {
    return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
  }

  try {
    const updated = sessionService.resume(session);
    await store.set(session.id, updated);
    return res.json({ sessionId: session.id, status: updated.status });
  } catch (err: any) {
    return res.status(err.status || 409).json({ error: { code: err.code, message: err.message } });
  }
});

export default router;
