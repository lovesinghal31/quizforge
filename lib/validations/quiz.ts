import { z } from 'zod';

export const quizFormSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(120),
  description: z.string().trim().optional(),
  category: z.string().trim().min(2, 'Category is required.'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  timeLimitMinutes: z.number().int().min(1, 'Time limit must be at least 1 minute.').max(180),
  questions: z
    .array(
      z.object({
        id: z.string().optional(),
        text: z.string().trim().min(1, 'Question text cannot be empty.'),
        options: z
          .array(
            z.object({
              id: z.string().optional(),
              text: z.string().trim().min(1, 'Option text cannot be empty.'),
              isCorrect: z.boolean(),
            })
          )
          .length(4, 'Each question must have exactly 4 options.'),
      })
    )
    .min(1, 'A quiz must contain at least one question.'),
});

export type QuizFormValues = z.infer<typeof quizFormSchema>;
