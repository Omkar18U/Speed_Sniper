// packages/api/src/services/gemini.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiGenerationResponse, Difficulty } from '../models/types';

// Fallback questions when API quota is exceeded
const FALLBACK_QUESTIONS: GeminiGenerationResponse = {
  resourceSummary: "Sample educational content for testing Speed Sniper game functionality",
  rounds: [
    {
      question: "What is the capital of France?",
      correct: "Paris",
      distractors: ["London", "Berlin", "Madrid", "Rome", "Amsterdam", "Brussels", "Vienna"]
    },
    {
      question: "Which planet is known as the Red Planet?",
      correct: "Mars",
      distractors: ["Venus", "Jupiter", "Saturn", "Mercury", "Neptune", "Uranus", "Pluto"]
    },
    {
      question: "What is 7 × 8?",
      correct: "56",
      distractors: ["48", "54", "64", "49", "63", "72", "42"]
    },
    {
      question: "Who wrote Romeo and Juliet?",
      correct: "Shakespeare",
      distractors: ["Dickens", "Austen", "Tolkien", "Hemingway", "Wilde", "Orwell", "Byron"]
    },
    {
      question: "What is the largest ocean on Earth?",
      correct: "Pacific",
      distractors: ["Atlantic", "Indian", "Arctic", "Southern", "Mediterranean", "Caribbean", "Baltic"]
    },
    {
      question: "Which gas makes up most of Earth's atmosphere?",
      correct: "Nitrogen",
      distractors: ["Oxygen", "Carbon Dioxide", "Hydrogen", "Helium", "Argon", "Methane", "Neon"]
    },
    {
      question: "What is the square root of 64?",
      correct: "8",
      distractors: ["6", "7", "9", "10", "12", "16", "4"]
    },
    {
      question: "Which continent is the driest?",
      correct: "Antarctica",
      distractors: ["Africa", "Australia", "Asia", "Europe", "North America", "South America", "Oceania"]
    },
    {
      question: "What is the chemical symbol for gold?",
      correct: "Au",
      distractors: ["Ag", "Fe", "Cu", "Pb", "Zn", "Al", "Pt"]
    },
    {
      question: "How many sides does a hexagon have?",
      correct: "Six",
      distractors: ["Four", "Five", "Seven", "Eight", "Nine", "Ten", "Three"]
    }
  ]
};

const BUILD_PROMPT = (resourceText: string, difficulty: Difficulty, roundCount: number): string => {
  const truncated = resourceText.slice(0, 8000); // ~2000 tokens
  const difficultyNote = {
    easy: 'straightforward recall',
    medium: 'applied understanding',
    hard: 'synthesis and inference',
  }[difficulty];

  return `You are generating content for an educational reflex game. The player will see a question and must tap the correct answer from 8 drifting tokens.

Resource text:
"""
${truncated}
"""

Generate exactly ${roundCount} rounds. Difficulty: ${difficulty}.

Rules:
- Each question must be answerable from the resource text
- The correct answer must be a short phrase (2-5 words max)
- Each of the 7 distractors must be plausible and from the same domain as the correct answer
- Distractors must NOT be obviously wrong
- At ${difficulty} difficulty: ${difficultyNote}

Return ONLY valid JSON matching this schema exactly:
{
  "resourceSummary": "One sentence summary of the resource",
  "rounds": [
    {
      "question": "string",
      "correct": "string",
      "distractors": ["string", "string", "string", "string", "string", "string", "string"]
    }
  ]
}`;
};

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateRounds(
    resourceText: string,
    difficulty: Difficulty,
    roundCount: number
  ): Promise<GeminiGenerationResponse> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = BUILD_PROMPT(resourceText, difficulty, roundCount);
    let _lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed: GeminiGenerationResponse = JSON.parse(text);

        // Validate structure
        if (!parsed.rounds || parsed.rounds.length !== roundCount) {
          throw new Error(`Expected ${roundCount} rounds, got ${parsed.rounds?.length}`);
        }
        for (const round of parsed.rounds) {
          if (!round.distractors || round.distractors.length !== 7) {
            throw new Error(`Each round must have exactly 7 distractors`);
          }
        }

        return parsed;
      } catch (err: any) {
        _lastError = err;
        console.error(`Gemini attempt ${attempt + 1} failed:`, err.message || err);

        // Check if it's a quota/rate-limit error - if so, return fallback immediately
        if (err.message && (err.message.includes('quota') || err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED'))) {
          console.log('Quota exceeded, using fallback questions for demo');
          return {
            ...FALLBACK_QUESTIONS,
            resourceSummary: `Demo questions (API quota reached) - ${FALLBACK_QUESTIONS.resourceSummary}`
          };
        }

        if (attempt < 2) {
          await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
        }
      }
    }

    // If all attempts failed and it's not a quota issue, still provide fallback for demo
    console.log('All Gemini attempts failed, using fallback questions for demo');
    return {
      ...FALLBACK_QUESTIONS,
      resourceSummary: `Demo questions (AI unavailable) - ${FALLBACK_QUESTIONS.resourceSummary}`
    };
  }
}

let _instance: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  if (!_instance) {
    _instance = new GeminiService(key);
  }
  return _instance;
}
