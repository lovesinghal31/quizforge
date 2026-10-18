'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth-server';
import {
  publishQuizSchema,
  draftQuizSchema,
  type QuizFormValues,
} from '@/lib/validations/quiz';

export interface ActionResponse {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  quizId?: string;
  isPublished?: boolean;
}

/**
 * Creates a new quiz (either Draft or Published).
 * Protected by server-side Better Auth session.
 */
export async function createQuizAction(
  data: QuizFormValues
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be signed in to create a quiz.' };
  }

  const userId = session.user.id;

  // Validate server-side based on publish intent
  const schemaToUse = data.isPublished ? publishQuizSchema : draftQuizSchema;
  const validation = schemaToUse.safeParse(data);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const firstErrorMessage =
      validation.error.issues[0]?.message || 'Validation failed. Please check the form.';
    return {
      error: firstErrorMessage,
      fieldErrors,
    };
  }

  const validatedData = validation.data;

  try {
    const createdQuiz = await prisma.$transaction(async (tx) => {
      return tx.quiz.create({
        data: {
          title: validatedData.title,
          description: validatedData.description || null,
          category: validatedData.category,
          difficulty: validatedData.difficulty,
          timeLimitSeconds: validatedData.timeLimitMinutes * 60,
          isPublished: validatedData.isPublished,
          creatorId: userId,
          questions: {
            create: validatedData.questions.map((q, qIndex) => ({
              text: q.text,
              explanation: q.explanation || null,
              position: qIndex + 1,
              options: {
                create: q.options.map((opt, optIndex) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                  position: optIndex + 1,
                })),
              },
            })),
          },
        },
        select: {
          id: true,
          isPublished: true,
        },
      });
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/my-quizzes');
    revalidatePath('/quizzes');

    return {
      success: true,
      quizId: createdQuiz.id,
      isPublished: createdQuiz.isPublished,
    };
  } catch (error) {
    console.error('Failed to create quiz:', error);
    return {
      error: 'An unexpected database error occurred while creating the quiz. Please try again.',
    };
  }
}

/**
 * Updates an existing quiz with full ownership verification.
 */
export async function updateQuizAction(
  quizId: string,
  data: QuizFormValues
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be signed in to edit a quiz.' };
  }

  const userId = session.user.id;

  // Verify quiz exists and belongs to the authenticated user
  const existingQuiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, creatorId: true },
  });

  if (!existingQuiz) {
    return { error: 'Quiz not found.' };
  }

  if (existingQuiz.creatorId !== userId) {
    return { error: 'Forbidden: You do not own this quiz.' };
  }

  // Validate server-side based on publish intent
  const schemaToUse = data.isPublished ? publishQuizSchema : draftQuizSchema;
  const validation = schemaToUse.safeParse(data);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const firstErrorMessage =
      validation.error.issues[0]?.message || 'Validation failed. Please check the form.';
    return {
      error: firstErrorMessage,
      fieldErrors,
    };
  }

  const validatedData = validation.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing questions (which cascades to options)
      await tx.question.deleteMany({
        where: { quizId },
      });

      // 2. Update quiz metadata and recreate questions & options atomically
      await tx.quiz.update({
        where: { id: quizId },
        data: {
          title: validatedData.title,
          description: validatedData.description || null,
          category: validatedData.category,
          difficulty: validatedData.difficulty,
          timeLimitSeconds: validatedData.timeLimitMinutes * 60,
          isPublished: validatedData.isPublished,
          questions: {
            create: validatedData.questions.map((q, qIndex) => ({
              text: q.text,
              explanation: q.explanation || null,
              position: qIndex + 1,
              options: {
                create: q.options.map((opt, optIndex) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                  position: optIndex + 1,
                })),
              },
            })),
          },
        },
      });
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/my-quizzes');
    revalidatePath(`/dashboard/my-quizzes/${quizId}/edit`);
    revalidatePath('/quizzes');
    revalidatePath(`/quizzes/${quizId}`);

    return {
      success: true,
      quizId,
      isPublished: validatedData.isPublished,
    };
  } catch (error) {
    console.error('Failed to update quiz:', error);
    return {
      error: 'An unexpected database error occurred while updating the quiz.',
    };
  }
}

/**
 * Deletes a quiz after verifying ownership.
 */
export async function deleteQuizAction(quizId: string): Promise<ActionResponse> {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be signed in to delete a quiz.' };
  }

  const userId = session.user.id;

  const existingQuiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, creatorId: true },
  });

  if (!existingQuiz) {
    return { error: 'Quiz not found.' };
  }

  if (existingQuiz.creatorId !== userId) {
    return { error: 'Forbidden: You do not have permission to delete this quiz.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete any quiz attempts if they exist
      await tx.quizAttempt.deleteMany({
        where: { quizId },
      });

      // Delete the quiz (cascades to questions and options)
      await tx.quiz.delete({
        where: { id: quizId },
      });
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/my-quizzes');
    revalidatePath('/quizzes');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete quiz:', error);
    return {
      error: 'Failed to delete quiz due to a database error.',
    };
  }
}

/**
 * Toggles a quiz between Draft and Published states with full validation on publish.
 */
export async function togglePublishQuizAction(quizId: string): Promise<ActionResponse> {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be signed in to modify quiz publication status.' };
  }

  const userId = session.user.id;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: {
          options: true,
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!quiz) {
    return { error: 'Quiz not found.' };
  }

  if (quiz.creatorId !== userId) {
    return { error: 'Forbidden: You do not own this quiz.' };
  }

  const targetPublished = !quiz.isPublished;

  // If publishing, validate that the quiz meets all requirements
  if (targetPublished) {
    const payloadToValidate: QuizFormValues = {
      title: quiz.title,
      description: quiz.description || '',
      category: quiz.category,
      difficulty: quiz.difficulty,
      timeLimitMinutes: Math.round(quiz.timeLimitSeconds / 60),
      isPublished: true,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        explanation: q.explanation || undefined,
        position: q.position,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          position: opt.position,
        })),
      })),
    };

    const validation = publishQuizSchema.safeParse(payloadToValidate);
    if (!validation.success) {
      const errorMsg =
        validation.error.issues[0]?.message ||
        'Cannot publish an incomplete quiz. Please complete all questions and options.';
      return { error: errorMsg };
    }
  }

  try {
    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: { isPublished: targetPublished },
      select: { id: true, isPublished: true },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/my-quizzes');
    revalidatePath('/quizzes');
    revalidatePath(`/quizzes/${quizId}`);

    return {
      success: true,
      quizId: updated.id,
      isPublished: updated.isPublished,
    };
  } catch (error) {
    console.error('Failed to toggle publish status:', error);
    return { error: 'Database error updating publication status.' };
  }
}
