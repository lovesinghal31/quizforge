'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth-server';
import {
  submitQuizAttemptSchema,
  saveAttemptAnswerSchema,
  type SubmitQuizAttemptPayload,
  type SaveAttemptAnswerPayload,
  type FinalizedAttemptResult,
} from '@/lib/validations/attempt';

export interface SubmitAttemptResponse extends Partial<FinalizedAttemptResult> {
  success?: boolean;
  error?: string;
  totalAnswered?: number;
}

/**
 * Starts a new quiz attempt or resumes an existing active in-progress attempt.
 * Validates session, publication status, and minimum question count.
 */
export async function startQuizAttemptAction(
  quizId: string
): Promise<{ success?: boolean; attemptId?: string; error?: string }> {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be signed in to start a quiz attempt.' };
  }

  const userId = session.user.id;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      isPublished: true,
      timeLimitSeconds: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  if (!quiz || !quiz.isPublished) {
    return { error: 'Quiz not found or is not published.' };
  }

  if (quiz._count.questions === 0) {
    return { error: 'This quiz has no questions and cannot be started.' };
  }

  const now = new Date();

  // Check if user already has an IN_PROGRESS attempt
  const existingActive = await prisma.quizAttempt.findFirst({
    where: {
      userId,
      quizId,
      status: 'IN_PROGRESS',
    },
    include: {
      answers: {
        select: {
          questionId: true,
          selectedOptionId: true,
          isCorrect: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  });

  if (existingActive) {
    const deadlineMs =
      existingActive.startedAt.getTime() + quiz.timeLimitSeconds * 1000;

    if (now.getTime() < deadlineMs) {
      // Re-use active attempt to prevent duplicate records
      return { success: true, attemptId: existingActive.id };
    }

    // Previous attempt has expired; calculate score from preserved valid answers and finalize
    const correctScore = existingActive.answers.filter((a) => a.isCorrect).length;
    await prisma.quizAttempt.update({
      where: { id: existingActive.id },
      data: {
        status: 'EXPIRED',
        score: correctScore,
        completedAt: new Date(deadlineMs),
        durationSeconds: quiz.timeLimitSeconds,
      },
    });
  }

  // Create fresh attempt with authoritative server timestamp
  const newAttempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      status: 'IN_PROGRESS',
      totalQuestions: quiz._count.questions,
      startedAt: now,
    },
  });

  return { success: true, attemptId: newAttempt.id };
}

/**
 * Saves a single answer selection in the background during an active attempt.
 * Verifies attempt ownership, in-progress status, deadline, and that the option belongs to the question.
 */
export async function saveAttemptAnswerAction(
  rawPayload: SaveAttemptAnswerPayload
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const validation = saveAttemptAnswerSchema.safeParse(rawPayload);
  if (!validation.success) {
    return { success: false, error: 'Invalid payload' };
  }

  const { attemptId, questionId, selectedOptionId } = validation.data;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: {
            where: { id: questionId },
            include: {
              options: {
                where: { id: selectedOptionId },
              },
            },
          },
        },
      },
    },
  });

  if (!attempt || attempt.userId !== session.user.id) {
    return { success: false, error: 'Attempt not found or unauthorized' };
  }

  if (attempt.status !== 'IN_PROGRESS') {
    return { success: false, error: 'Attempt is already finalized' };
  }

  const now = new Date();
  const deadlineMs =
    attempt.startedAt.getTime() + attempt.quiz.timeLimitSeconds * 1000;
  if (now.getTime() > deadlineMs + 15000) {
    return { success: false, error: 'Attempt has expired' };
  }

  const question = attempt.quiz.questions[0];
  if (!question) {
    return { success: false, error: 'Question not found in quiz' };
  }

  const option = question.options[0];
  if (!option) {
    return { success: false, error: 'Option not found in question' };
  }

  await prisma.attemptAnswer.upsert({
    where: {
      attemptId_questionId: {
        attemptId,
        questionId,
      },
    },
    update: {
      selectedOptionId,
      isCorrect: option.isCorrect,
    },
    create: {
      attemptId,
      questionId,
      selectedOptionId,
      isCorrect: option.isCorrect,
    },
  });

  return { success: true };
}

/**
 * Submits an active quiz attempt with server-side validation, authoritative deadline enforcement,
 * transactional persistence, and idempotent concurrency-safe finalization.
 */
export async function submitQuizAttemptAction(
  rawPayload: SubmitQuizAttemptPayload
): Promise<SubmitAttemptResponse> {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be signed in to submit a quiz attempt.' };
  }

  const userId = session.user.id;

  const validation = submitQuizAttemptSchema.safeParse(rawPayload);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Invalid attempt payload.',
    };
  }

  const { attemptId, answers } = validation.data;

  // Retrieve attempt with quiz, questions, and options
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { position: 'asc' },
            include: {
              options: {
                orderBy: { position: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    return { error: 'Attempt not found or access denied.' };
  }

  // Strict ownership: user can only submit their own attempt
  if (attempt.userId !== userId) {
    return { error: 'Forbidden: You do not own this quiz attempt.' };
  }

  const totalQuestions = attempt.quiz.questions.length;

  // Idempotency check: If already finalized, return authoritative persisted result
  if (attempt.status !== 'IN_PROGRESS') {
    const existingAnswers = await prisma.attemptAnswer.findMany({
      where: { attemptId },
    });
    const correctAnswers = existingAnswers.filter((a) => a.isCorrect).length;
    const answeredCount = existingAnswers.filter((a) => Boolean(a.selectedOptionId)).length;
    const unansweredQuestions = totalQuestions - answeredCount;
    const incorrectAnswers = answeredCount - correctAnswers;
    const percentage =
      totalQuestions > 0
        ? Math.round((attempt.score / totalQuestions) * 1000) / 10
        : 0;
    const durationSeconds = attempt.durationSeconds ?? attempt.quiz.timeLimitSeconds;

    return {
      success: true,
      attemptId,
      status: attempt.status,
      score: attempt.score,
      maxScore: totalQuestions,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      totalAnswered: answeredCount,
      percentage,
      durationSeconds,
      completedAt: attempt.completedAt?.toISOString() || null,
      alreadyFinalized: true,
    };
  }

  const now = new Date();
  const deadlineMs =
    attempt.startedAt.getTime() + attempt.quiz.timeLimitSeconds * 1000;
  // 15 seconds grace period for network latency on timer expiration
  const exceedsGracePeriod = now.getTime() > deadlineMs + 15000;
  const isPastDeadline = now.getTime() > deadlineMs;
  const finalStatus: 'COMPLETED' | 'EXPIRED' =
    isPastDeadline || exceedsGracePeriod ? 'EXPIRED' : 'COMPLETED';

  // Load any previously autosaved answers in PostgreSQL for this attempt
  const existingSavedAnswers = await prisma.attemptAnswer.findMany({
    where: { attemptId },
  });
  const savedAnswerMap = new Map<string, string>();
  for (const ans of existingSavedAnswers) {
    if (ans.selectedOptionId) {
      savedAnswerMap.set(ans.questionId, ans.selectedOptionId);
    }
  }

  // If submission arrived within allowed time or grace period, merge submitted answers.
  // If severely past grace period, reject late client edits and finalize using answers saved before expiry.
  const mergedAnswers = new Map<string, string>(savedAnswerMap);
  if (!exceedsGracePeriod) {
    for (const item of answers) {
      if (item.selectedOptionId) {
        mergedAnswers.set(item.questionId, item.selectedOptionId);
      }
    }
  }

  // Build question and option lookup maps for strict validation
  const questionMap = new Map<string, (typeof attempt.quiz.questions)[number]>();
  for (const q of attempt.quiz.questions) {
    questionMap.set(q.id, q);
  }

  let calculatedScore = 0;
  const validAnswerRecords: Array<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }> = [];

  for (const [qId, optId] of mergedAnswers.entries()) {
    const question = questionMap.get(qId);
    if (!question) {
      return {
        error: 'Security violation: Submitted question does not belong to this quiz.',
      };
    }

    const matchingOption = question.options.find((opt) => opt.id === optId);
    if (!matchingOption) {
      return {
        error: 'Security violation: Selected option does not belong to the question.',
      };
    }

    if (matchingOption.isCorrect) {
      calculatedScore += 1;
    }

    validAnswerRecords.push({
      questionId: qId,
      selectedOptionId: optId,
      isCorrect: matchingOption.isCorrect,
    });
  }

  const answeredCount = validAnswerRecords.length;
  const correctAnswers = calculatedScore;
  const unansweredQuestions = totalQuestions - answeredCount;
  const incorrectAnswers = answeredCount - correctAnswers;
  const percentage =
    totalQuestions > 0
      ? Math.round((calculatedScore / totalQuestions) * 1000) / 10
      : 0;
  const durationSeconds = Math.min(
    attempt.quiz.timeLimitSeconds,
    Math.max(1, Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000))
  );

  try {
    await prisma.$transaction(async (tx) => {
      // Atomic conditional update: only transition if status is still IN_PROGRESS
      const updateResult = await tx.quizAttempt.updateMany({
        where: {
          id: attemptId,
          status: 'IN_PROGRESS',
        },
        data: {
          status: finalStatus,
          score: calculatedScore,
          completedAt: now,
          durationSeconds,
        },
      });

      if (updateResult.count === 0) {
        // Concurrent finalization collision detected
        throw new Error('CONCURRENCY_FINALIZED');
      }

      // Replace attempt answers with validated final set
      await tx.attemptAnswer.deleteMany({
        where: { attemptId },
      });

      if (validAnswerRecords.length > 0) {
        await tx.attemptAnswer.createMany({
          data: validAnswerRecords.map((ans) => ({
            attemptId,
            questionId: ans.questionId,
            selectedOptionId: ans.selectedOptionId,
            isCorrect: ans.isCorrect,
          })),
        });
      }
    });

    revalidatePath('/dashboard');
    revalidatePath('/quizzes');
    revalidatePath(`/quizzes/${attempt.quizId}`);

    return {
      success: true,
      attemptId,
      status: finalStatus,
      score: calculatedScore,
      maxScore: totalQuestions,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      totalAnswered: answeredCount,
      percentage,
      durationSeconds,
      completedAt: now.toISOString(),
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'CONCURRENCY_FINALIZED') {
      // Return authoritative state from the winning concurrent finalization
      const existing = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: { answers: true },
      });
      if (existing) {
        const cAnswers = existing.answers.filter((a) => a.isCorrect).length;
        const aCount = existing.answers.filter((a) => Boolean(a.selectedOptionId)).length;
        const uQuestions = totalQuestions - aCount;
        const pct =
          totalQuestions > 0
            ? Math.round((existing.score / totalQuestions) * 1000) / 10
            : 0;

        return {
          success: true,
          attemptId,
          status: existing.status as 'COMPLETED' | 'EXPIRED',
          score: existing.score,
          maxScore: totalQuestions,
          totalQuestions,
          correctAnswers: cAnswers,
          incorrectAnswers: aCount - cAnswers,
          unansweredQuestions: uQuestions,
          totalAnswered: aCount,
          percentage: pct,
          durationSeconds: existing.durationSeconds ?? attempt.quiz.timeLimitSeconds,
          completedAt: existing.completedAt?.toISOString() || null,
          alreadyFinalized: true,
        };
      }
    }

    console.error('Failed to submit quiz attempt:', error);
    return {
      error: 'An unexpected database error occurred while submitting the quiz.',
    };
  }
}
