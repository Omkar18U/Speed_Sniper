// packages/api/src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodTypeAny, ZodError } from 'zod';

export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }))
          }
        });
        return;
      }
      next(error);
    }
  };
};

export const CreateSessionSchema = z.object({
  body: z.object({
    resourceText: z.string().min(10, 'Resource text must be at least 10 characters long'),
    fileName: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    rounds: z.number().int().min(1).max(20).default(10),
  })
});

export const TapSchema = z.object({
  body: z.object({
    roundId: z.string().uuid().or(z.string().min(1)),
    selectedAnswer: z.string().min(1),
    tapTimestamp: z.number().int().positive(),
  })
});

export const MissSchema = z.object({
  body: z.object({
    roundId: z.string().uuid().or(z.string().min(1)),
  })
});
