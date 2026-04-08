// packages/api/src/main.ts
// Load environment variables FIRST (before any imports that use process.env)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({
  path: ((): string | undefined => {
    // Try candidate .env paths — first one that exists wins
    const candidates: string[] = [
      _path.resolve(_path.dirname(require.resolve('./main')), '../../.env'),  // packages/api/.env from dist subdir
      _path.resolve(process.cwd(), 'packages/api/.env'),  // NX workspace root run
      _path.resolve(process.cwd(), '.env'),               // root .env fallback
    ];
    for (const p of candidates) {
      try {
        if (_fs.existsSync(p)) {
          console.log('[env] Loading:', p);
          return p;
        }
      } catch (_) { /* ignore */ }
    }
    return undefined;
  })()
});

import express from 'express';
import cors from 'cors';
import * as path from 'path';
import pino from 'pino-http';
import rateLimit from 'express-rate-limit';
import sessionRoutes from './routes/sessions';
import tapRoutes from './routes/tap';
import missRoutes from './routes/miss';
import resultRoutes from './routes/result';
import pauseRoutes from './routes/pause';
import { errorHandler } from './middleware/errorHandler';
import { store } from './store/session.store';

const app = express();

// 1. Logging (Structured JSON)
app.use(pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
}));

// 2. Rate Limiting
const generalLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
});

const sessionCreateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Session creation limit reached. Please wait a minute.' } }
});

// 3. CORS & Parsing
const corsOrigins = process.env.CORS_ORIGINS || '*';
app.use(cors({
  origin: corsOrigins === '*' ? '*' : corsOrigins.split(','),
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));
app.options('*', cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Health Check (Public)
app.get('/api/v1/health', async (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    sessionCount: await store.size()
  });
});

// Protected Routes
app.use('/api/v1/sessions', generalLimit);
app.post('/api/v1/sessions', sessionCreateLimit); // Specific limit for creation

// Specific action routes
app.use('/api/v1/sessions/:id/tap', tapRoutes);
app.use('/api/v1/sessions/:id/miss', missRoutes);
app.use('/api/v1/sessions/:id/result', resultRoutes);
app.use('/api/v1/sessions/:id/pause', pauseRoutes);
app.use('/api/v1/sessions/:id/resume', pauseRoutes);

// General session routes (includes GET, POST, DELETE, and /:id/start)
app.use('/api/v1/sessions', sessionRoutes);

// Error Handling
app.use(errorHandler);

export { app };

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`Speed Sniper API listening at http://localhost:${port}/api/v1`);
  });

  server.on('error', console.error);

  // Prune sessions every 5 minutes
  setInterval(() => {
    store.prune();
  }, 5 * 60 * 1000);
}
