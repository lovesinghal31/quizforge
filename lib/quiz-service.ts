import prisma from '@/lib/prisma';
import type { Difficulty, Prisma } from '@/generated/prisma/client';

export interface QuizFilterParams {
  q?: string;
  category?: string;
  difficulty?: string;
  page?: number;
  pageSize?: number;
}

export interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: Difficulty;
  timeLimitSeconds: number;
  createdAt: Date;
  creator: {
    id: string;
    name: string;
    image: string | null;
  };
  _count: {
    questions: number;
    attempts: number;
  };
}

export async function getPublishedQuizzes(params: QuizFilterParams = {}) {
  const { q, category, difficulty, page = 1, pageSize = 12 } = params;

  const trimmedQuery = q?.trim();
  const validDifficulty =
    difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty.toUpperCase())
      ? (difficulty.toUpperCase() as Difficulty)
      : undefined;

  const validCategory =
    category && category.toLowerCase() !== 'all' ? category.trim() : undefined;

  const whereClause: Prisma.QuizWhereInput = {
    isPublished: true,
    ...(trimmedQuery
      ? {
          title: {
            contains: trimmedQuery,
            mode: 'insensitive',
          },
        }
      : {}),
    ...(validCategory
      ? {
          category: {
            equals: validCategory,
            mode: 'insensitive',
          },
        }
      : {}),
    ...(validDifficulty
      ? {
          difficulty: validDifficulty,
        }
      : {}),
  };

  try {
    const [quizzes, totalCount, distinctCategories] = await Promise.all([
      prisma.quiz.findMany({
        where: whereClause,
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
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
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

    return {
      quizzes: quizzes as QuizSummary[],
      totalCount,
      categories,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error) {
    console.error('Error fetching published quizzes:', error);
    return {
      quizzes: [],
      totalCount: 0,
      categories: [],
      page: 1,
      pageSize,
      totalPages: 0,
    };
  }
}

export async function getQuizById(id: string) {
  try {
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
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        questions: {
          select: {
            id: true,
            text: true,
            explanation: true,
            position: true,
            _count: {
              select: {
                options: true,
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!quiz || !quiz.isPublished) {
      return null;
    }

    return quiz;
  } catch (error) {
    console.error('Error fetching quiz by ID:', error);
    return null;
  }
}

/**
 * Fetches full quiz details for an author to edit, including questions,
 * options, and correct answers. Enforces creator ownership.
 */
export async function getAuthorQuizById(id: string, userId: string) {
  try {
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
      return null;
    }

    if (quiz.creatorId !== userId) {
      return null;
    }

    return quiz;
  } catch (error) {
    console.error('Error fetching author quiz by ID:', error);
    return null;
  }
}


export async function getDashboardData(userId: string) {
  try {
    const [
      publishedCount,
      userQuizzesCount,
      userCompletedAttempts,
      avgScoreResult,
      recentlyPublished,
      recentAttempts,
    ] = await Promise.all([
      // 1. Total published quizzes available for discovery
      prisma.quiz.count({ where: { isPublished: true } }),

      // 2. User created quizzes
      prisma.quiz.count({ where: { creatorId: userId } }),

      // 3. User completed attempts
      prisma.quizAttempt.count({ where: { userId, status: 'COMPLETED' } }),

      // 4. User average score
      prisma.quizAttempt
        .aggregate({
          where: { userId, status: 'COMPLETED' },
          _avg: { score: true },
        })
        .then((res) => res._avg.score),

      // 5. Recently published quizzes for discovery recommendations
      prisma.quiz.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 4,
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
            },
          },
        },
      }),

      // 6. User's recent attempts
      prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          score: true,
          totalQuestions: true,
          startedAt: true,
          completedAt: true,
          quiz: {
            select: {
              title: true,
            },
          },
        },
      }),
    ]);

    return {
      stats: {
        totalPublishedQuizzes: publishedCount,
        quizzesCreated: userQuizzesCount,
        attemptsCompleted: userCompletedAttempts,
        averageScore: avgScoreResult !== null ? Math.round(avgScoreResult) : null,
      },
      recentlyPublished,
      recentAttempts,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      stats: {
        totalPublishedQuizzes: 0,
        quizzesCreated: 0,
        attemptsCompleted: 0,
        averageScore: null,
      },
      recentlyPublished: [],
      recentAttempts: [],
    };
  }
}
