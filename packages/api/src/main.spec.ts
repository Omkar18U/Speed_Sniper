// packages/api/src/main.spec.ts
import request from 'supertest';
import { app } from './main';

// Mock Gemini so POST /sessions doesn't need a real API key in unit tests
jest.mock('./services/gemini.service', () => ({
  getGeminiService: jest.fn(() => ({
    generateRounds: jest.fn().mockResolvedValue({
      resourceSummary: 'A mock summary.',
      rounds: Array.from({ length: 10 }, (_, i) => ({
        question: `What is concept ${i + 1}?`,
        correct: `Answer ${i + 1}`,
        distractors: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
      })),
    }),
  })),
}));

describe('Speed Sniper API Foundation (Phase 1 + 2)', () => {
  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'mock-key';
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 and status ok', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });


  describe('POST /api/v1/sessions', () => {
    it('should return 201 with Gemini-generated rounds', async () => {
      const res = await request(app)
        .post('/api/v1/sessions')
        .send({ resourceText: 'Sample resource text about photosynthesis.' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('sessionId');
      expect(res.body.status).toBe('lobby');
      expect(res.body.rounds).toHaveLength(10);
      expect(res.body.rounds[0].tokens).toHaveLength(8);
    });

    it('should return 400 if resourceText is missing', async () => {
      const res = await request(app)
        .post('/api/v1/sessions')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/sessions/:id', () => {
    it('should return session details after creation', async () => {
      const createRes = await request(app)
        .post('/api/v1/sessions')
        .send({ resourceText: 'Sample resource text that is long enough.' });

      const sessionId = createRes.body.sessionId;
      const res = await request(app)
        .get(`/api/v1/sessions/${sessionId}`);

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe(sessionId);
      expect(res.body.status).toBe('lobby');
    });

    it('should return 404 for unknown session', async () => {
      const res = await request(app)
        .get('/api/v1/sessions/unknown-id');
      expect(res.status).toBe(404);
    });
  });
});
