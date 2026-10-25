import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth-server';


interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/quizzes/[id]/submit
 * Evaluates submitted answers authoritatively against database answer keys
 * and records the attempt in PostgreSQL.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession(request.headers);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to submit a quiz.' },
        { status: 401 }
      );
    }

    const { id: quizId } = await params;
    const body = await request.json();
    const answers: Record<string, string> = body.answers || {};

    // 1. Fetch questions and options with authoritative answer keys from PostgreSQL
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    // 2. Authoritative server-side score calculation
    let score = 0;
    for (const question of quiz.questions) {
      const selectedOptionId = answers[question.id];
      const correctOption = question.options.find((opt) => opt.isCorrect);
      if (correctOption && correctOption.id === selectedOptionId) {
        score += 1;
      }
    }

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    // 3. Save attempt record in PostgreSQL
    await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId,
        status: 'COMPLETED',
        score,
        totalQuestions,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        score,
        totalQuestions,
        percentage,
      },
    });
  } catch (error) {
    console.error('POST /api/quizzes/[id]/submit error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz attempt.' },
      { status: 500 }
    );
  }
}
