// packages/api/src/services/gemini.service.spec.ts
import { GeminiService } from './gemini.service';

// Mock the @google/generative-ai module
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn(),
      }),
    })),
  };
});

const { GoogleGenerativeAI } = require('@google/generative-ai');

function buildMockResponse(rounds: any[]) {
  return {
    response: {
      text: () => JSON.stringify({
        resourceSummary: 'A summary.',
        rounds,
      }),
    },
  };
}

function buildRound() {
  return {
    question: 'What is X?',
    correct: 'Answer X',
    distractors: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
  };
}

describe('GeminiService', () => {
  let service: GeminiService;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    service = new GeminiService('test-api-key');
    // Get the mock instance
    const mockInstance = (GoogleGenerativeAI as jest.Mock).mock.results[0].value;
    mockGenerateContent = mockInstance.getGenerativeModel().generateContent;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return parsed rounds on success', async () => {
    const rounds = Array.from({ length: 10 }, buildRound);
    mockGenerateContent.mockResolvedValueOnce(buildMockResponse(rounds));

    const result = await service.generateRounds('Some text', 'medium', 10);

    expect(result.rounds).toHaveLength(10);
    expect(result.resourceSummary).toBe('A summary.');
    expect(result.rounds[0].distractors).toHaveLength(7);
  });

  it('should retry up to 2 times on failure then throw', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Gemini API error'));
    const promise = service.generateRounds('Some text', 'easy', 10);
    
    // Fast-forward through retries
    for (let i = 0; i < 3; i++) {
      await jest.runAllTimersAsync();
    }

    await expect(promise).rejects.toMatchObject({ code: 'GENERATION_FAILED' });
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it('should retry if round count is wrong', async () => {
    const wrongRounds = Array.from({ length: 5 }, buildRound); // Wrong count
    const correctRounds = Array.from({ length: 10 }, buildRound);

    mockGenerateContent
      .mockResolvedValueOnce(buildMockResponse(wrongRounds))
      .mockResolvedValueOnce(buildMockResponse(correctRounds));

    const resultPromise = service.generateRounds('Some text', 'hard', 10);

    // Fast-forward through retries
    for (let i = 0; i < 2; i++) {
        await jest.runAllTimersAsync();
    }

    const result = await resultPromise;

    expect(result.rounds).toHaveLength(10);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('should fail if distractors count is wrong', async () => {
    const badRound = { question: 'Q', correct: 'A', distractors: ['D1', 'D2'] }; // Only 2
    mockGenerateContent.mockResolvedValue(buildMockResponse([...Array(10).fill(badRound)]));

    const promise = service.generateRounds('Some text', 'medium', 10);
    
    // Fast-forward through retries
    for (let i = 0; i < 3; i++) {
        await jest.runAllTimersAsync();
    }

    await expect(promise).rejects.toMatchObject({ code: 'GENERATION_FAILED' });
  });
});
