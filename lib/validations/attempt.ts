import { z } from 'zod';

export const submitAttemptAnswerSchema = z.object({
  questionId: z.string().uuid('Invalid question ID format.'),
  selectedOptionId: z.string().uuid('Invalid option ID format.').nullable().optional(),
});

export const submitQuizAttemptSchema = z.object({
  attemptId: z.string().uuid('Invalid attempt ID format.'),
  answers: z
    .array(submitAttemptAnswerSchema)
    .max(250, 'Answer payload exceeds maximum allowed limit of 250 items.'),
});

export const saveAttemptAnswerSchema = z.object({
  attemptId: z.string().uuid('Invalid attempt ID format.'),
  questionId: z.string().uuid('Invalid question ID format.'),
  selectedOptionId: z.string().uuid('Invalid option ID format.'),
});

export const startQuizAttemptSchema = z.object({
  quizId: z.string().uuid('Invalid quiz ID format.'),
});

export type SubmitQuizAttemptPayload = z.infer<typeof submitQuizAttemptSchema>;
export type SubmitAttemptAnswerPayload = z.infer<typeof submitAttemptAnswerSchema>;
export type SaveAttemptAnswerPayload = z.infer<typeof saveAttemptAnswerSchema>;
export type StartQuizAttemptPayload = z.infer<typeof startQuizAttemptSchema>;

/**
 * Authoritative summary metrics for a finalized quiz attempt.
 */
export interface FinalizedAttemptResult {
  attemptId: string;
  status: 'COMPLETED' | 'EXPIRED';
  score: number;
  maxScore: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  percentage: number;
  durationSeconds: number;
  completedAt: string | null;
  alreadyFinalized?: boolean;
}
