import { z } from 'zod';

export const submitQuizSchema = z.object({
  quizId: z.string(),
  answers: z.record(z.string(), z.string()), // questionId -> selectedOptionId
});

export type SubmitQuizPayload = z.infer<typeof submitQuizSchema>;

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
}
