import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth-server';
import { quizFormSchema } from '@/lib/validations/quiz';


interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/quizzes/[id]
 * - If ?forEdit=true: Requires creator authentication, returns full quiz with isCorrect
 * - Otherwise: Returns quiz details and questions/options without isCorrect for test takers
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forEdit = searchParams.get('forEdit') === 'true';

    // 1. Author edit request (requires ownership)
    if (forEdit) {
      const session = await getSession(request.headers);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const quiz = await prisma.quiz.findUnique({
        where: { id },
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
      });

      if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
      }

      if (quiz.creatorId !== session.user.id) {
        return NextResponse.json(
          { error: 'Forbidden: You do not own this quiz.' },
          { status: 403 }
        );
      }

      return NextResponse.json({ quiz });
    }

    // 2. Public quiz details / test-taking (strips isCorrect for integrity)
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        timeLimitSeconds: true,
        isPublished: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            text: true,
            options: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                text: true,
              },
            },
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('GET /api/quizzes/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz details.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quizzes/[id]
 * Updates an existing quiz with author ownership check
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession(request.headers);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to edit a quiz.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
      select: { id: true, creatorId: true },
    });

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    if (existingQuiz.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this quiz.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = quizFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Validation failed.' },
        { status: 400 }
      );
    }

    const { title, description, category, difficulty, timeLimitMinutes, questions } = validation.data;

    await prisma.$transaction(async (tx) => {
      // Delete existing questions (options cascade delete)
      await tx.question.deleteMany({
        where: { quizId: id },
      });

      // Update quiz details and insert updated questions/options
      await tx.quiz.update({
        where: { id },
        data: {
          title,
          description: description || null,
          category,
          difficulty,
          timeLimitSeconds: timeLimitMinutes * 60,
          questions: {
            create: questions.map((q, qIndex) => ({
              text: q.text,
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

    return NextResponse.json({ success: true, quizId: id });
  } catch (error) {
    console.error('PUT /api/quizzes/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update quiz.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quizzes/[id]
 * Deletes a quiz and its questions, options, and attempts
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession(request.headers);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to delete a quiz.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
      select: { id: true, creatorId: true },
    });

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    if (existingQuiz.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this quiz.' },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.quizAttempt.deleteMany({ where: { quizId: id } });
      await tx.quiz.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/quizzes/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete quiz.' },
      { status: 500 }
    );
  }
}
