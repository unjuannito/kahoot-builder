import { z } from 'zod';
import { KAHOOT_TIMES } from '../types/kahoot.types.js';

const answer = z.string().trim().min(1).max(75);

export const createSessionSchema = z.object({
  code: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

export const createQuestionSchema = z.object({
  session_id: z.string().uuid(),
  question: z.string().trim().min(1).max(120),
  option1: answer,
  option2: answer,
  option3: answer,
  option4: answer,
  time: z.number().int().refine((value) => (KAHOOT_TIMES as readonly number[]).includes(value)),
  correct: z.string().regex(/^[1-4](,[1-4])*$/),
});

export const updateQuestionSchema = z.object({
  question: z.string().trim().min(1).max(120),
  option1: answer,
  option2: answer,
  option3: answer,
  option4: answer,
  time: z.number().int().refine((value) => (KAHOOT_TIMES as readonly number[]).includes(value)),
  correct: z.string().regex(/^[1-4](,[1-4])*$/),
});

export const sessionParamSchema = z.object({ code: z.string().trim().min(3).max(32) });
export const questionIdParamSchema = z.object({ id: z.string().uuid() });
