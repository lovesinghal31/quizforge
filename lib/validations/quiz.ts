import { z } from 'zod';

export const optionInputSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim(),
  isCorrect: z.boolean().default(false),
  position: z.number().int().min(1).max(4),
});

export const questionInputSchema = z
  .object({
    id: z.string().optional(),
    text: z.string().trim(),
    explanation: z.string().trim().optional(),
    position: z.number().int().min(1),
    options: z
      .array(optionInputSchema)
      .length(4, 'Each question must have exactly 4 answer options.'),
  })
  .refine(
    (q) => {
      // Must have exactly one correct answer
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      return correctCount === 1;
    },
    {
      message: 'Each question must have exactly one correct answer selected.',
      path: ['options'],
    }
  );

export const quizMetadataSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters long.')
    .max(120, 'Title cannot exceed 120 characters.'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters.')
    .optional()
    .or(z.literal('')),
  category: z
    .string()
    .trim()
    .min(2, 'Category must be at least 2 characters long.')
    .max(50, 'Category cannot exceed 50 characters.'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], {
    message: 'Please select a valid difficulty level (Easy, Medium, Hard).',
  }),
  timeLimitMinutes: z
    .number({ message: 'Time limit is required.' })
    .int('Time limit must be a whole number of minutes.')
    .min(1, 'Time limit must be at least 1 minute.')
    .max(180, 'Time limit cannot exceed 180 minutes (3 hours).'),
  isPublished: z.boolean().default(false),
});

// Full quiz schema used for publishing validation
export const publishQuizSchema = quizMetadataSchema.extend({
  questions: z
    .array(questionInputSchema)
    .min(1, 'A published quiz must contain at least one question.')
    .refine(
      (questions) => {
        // Every question must have non-empty text
        return questions.every((q) => q.text.trim().length > 0);
      },
      {
        message: 'All questions must have non-empty question text.',
        path: ['questions'],
      }
    )
    .refine(
      (questions) => {
        // Every option in every question must have non-empty text
        return questions.every((q) =>
          q.options.every((opt) => opt.text.trim().length > 0)
        );
      },
      {
        message: 'All 4 options for each question must contain text.',
        path: ['questions'],
      }
    ),
});

// Draft quiz schema: allows partial questions/options, but enforces structural limits
export const draftQuizSchema = quizMetadataSchema.extend({
  questions: z.array(
    z.object({
      id: z.string().optional(),
      text: z.string().trim(),
      explanation: z.string().trim().optional(),
      position: z.number().int().min(1),
      options: z.array(optionInputSchema).length(4),
    })
  ),
});

export type QuizMetadataValues = z.infer<typeof quizMetadataSchema>;
export type QuestionInputValues = z.infer<typeof questionInputSchema>;
export type OptionInputValues = z.infer<typeof optionInputSchema>;
export type QuizFormValues = z.infer<typeof draftQuizSchema>;
