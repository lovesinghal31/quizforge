import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth-server';
import { quizFormSchema } from '@/lib/validations/quiz';


/**
 * GET /api/quizzes
 * Returns:
 * - If ?mine=true: Returns all quizzes created by the logged-in user
 * - Otherwise: Returns published quizzes with optional ?q=..., ?category=..., ?difficulty=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get('mine') === 'true';

    // 1. Author's own quizzes
    if (mine) {
      const session = await getSession(request.headers);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const quizzes = await prisma.quiz.findMany({
        where: { creatorId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          timeLimitSeconds: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      });

      return NextResponse.json({ quizzes });
    }

    // 2. Public published quizzes catalog
    const q = searchParams.get('q')?.trim();
    const category = searchParams.get('category')?.trim();
    const difficulty = searchParams.get('difficulty')?.trim();

    const whereClause: {
      isPublished: boolean;
      title?: { contains: string; mode: 'insensitive' };
      category?: { equals: string; mode: 'insensitive' };
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    } = {
      isPublished: true,
    };

    if (q) {
      whereClause.title = { contains: q, mode: 'insensitive' };
    }
    if (category && category.toLowerCase() !== 'all') {
      whereClause.category = { equals: category, mode: 'insensitive' };
    }
    if (difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty.toUpperCase())) {
      whereClause.difficulty = difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
    }

    const [quizzes, totalCount, distinctCategories] = await Promise.all([
      prisma.quiz.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          timeLimitSeconds: true,
          createdAt: true,
          creator: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      }),
      prisma.quiz.count({ where: whereClause }),
      prisma.quiz.findMany({
        where: { isPublished: true },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      }),
    ]);

    const categories = distinctCategories.map((c) => c.category);

    return NextResponse.json({ quizzes, totalCount, categories });
  } catch (error) {
    console.error('GET /api/quizzes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quizzes
 * Creates a new published quiz with nested questions and options
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request.headers);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to create a quiz.' },
        { status: 401 }
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

    const createdQuiz = await prisma.quiz.create({
      data: {
        title,
        description: description || null,
        category,
        difficulty,
        timeLimitSeconds: timeLimitMinutes * 60,
        isPublished: true,
        creatorId: session.user.id,
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

    return NextResponse.json(
      { success: true, quizId: createdQuiz.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/quizzes error:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz.' },
      { status: 500 }
    );
  }
}
