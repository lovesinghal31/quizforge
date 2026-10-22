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

export interface SafeOptionDTO {
  id: string;
  text: string;
  position: number;
}

export interface SafeQuestionDTO {
  id: string;
  text: string;
  position: number;
  options: SafeOptionDTO[];
}

export interface FinalizedAttemptDTO {
  id: string;
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
}

export interface QuizTakingData {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    difficulty: Difficulty;
    timeLimitSeconds: number;
  };
  attempt?: {
    id: string;
    startedAt: string;
    deadline: string;
  };
  questions?: SafeQuestionDTO[];
  savedAnswers?: Record<string, string>;
  finalizedAttempt?: FinalizedAttemptDTO;
}

/**
 * Loads published quiz for an active student attempt without exposing answer keys,
 * initializes or resumes an active QuizAttempt, and calculates authoritative deadlines.
 * If the attempt has already finalized or expired, returns the finalized state instead of creating a duplicate.
 */
export async function getQuizForTaking(
  quizId: string,
  userId: string
): Promise<QuizTakingData | null> {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        timeLimitSeconds: true,
        isPublished: true,
        questions: {
          select: {
            id: true,
            text: true,
            position: true,
            options: {
              select: {
                id: true,
                text: true,
                position: true,
              },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!quiz || !quiz.isPublished || quiz.questions.length === 0) {
      return null;
    }

    const now = new Date();

    // Check for an active in-progress attempt
    const activeAttempt = await prisma.quizAttempt.findFirst({
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

    if (activeAttempt) {
      const deadline = new Date(
        activeAttempt.startedAt.getTime() + quiz.timeLimitSeconds * 1000
      );

      // If active attempt deadline has passed, finalize as EXPIRED and score valid answers
      if (now.getTime() >= deadline.getTime()) {
        const totalQuestions = quiz.questions.length;
        const correctAnswers = activeAttempt.answers.filter((a) => a.isCorrect).length;
        const answeredCount = activeAttempt.answers.filter((a) =>
          Boolean(a.selectedOptionId)
        ).length;
        const unansweredQuestions = totalQuestions - answeredCount;
        const incorrectAnswers = answeredCount - correctAnswers;
        const percentage =
          totalQuestions > 0
            ? Math.round((correctAnswers / totalQuestions) * 1000) / 10
            : 0;

        await prisma.quizAttempt.update({
          where: { id: activeAttempt.id },
          data: {
            status: 'EXPIRED',
            score: correctAnswers,
            completedAt: deadline,
            durationSeconds: quiz.timeLimitSeconds,
          },
        });

        return {
          quiz: {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            category: quiz.category,
            difficulty: quiz.difficulty,
            timeLimitSeconds: quiz.timeLimitSeconds,
          },
          finalizedAttempt: {
            id: activeAttempt.id,
            status: 'EXPIRED',
            score: correctAnswers,
            maxScore: totalQuestions,
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
            unansweredQuestions,
            percentage,
            durationSeconds: quiz.timeLimitSeconds,
            completedAt: deadline.toISOString(),
          },
        };
      }

      // Active attempt is within its authoritative deadline: resume it
      const savedAnswers: Record<string, string> = {};
      if (activeAttempt.answers) {
        for (const ans of activeAttempt.answers) {
          if (ans.selectedOptionId) {
            savedAnswers[ans.questionId] = ans.selectedOptionId;
          }
        }
      }

      return {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty,
          timeLimitSeconds: quiz.timeLimitSeconds,
        },
        attempt: {
          id: activeAttempt.id,
          startedAt: activeAttempt.startedAt.toISOString(),
          deadline: deadline.toISOString(),
        },
        questions: quiz.questions,
        savedAnswers,
      };
    }

    // No active attempt: check for the most recent completed or expired attempt
    const recentAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId,
        status: { in: ['COMPLETED', 'EXPIRED'] },
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
      orderBy: { completedAt: 'desc' },
    });

    if (recentAttempt) {
      const totalQuestions = recentAttempt.totalQuestions;
      const correctAnswers = recentAttempt.answers.filter((a) => a.isCorrect).length;
      const answeredCount = recentAttempt.answers.filter((a) =>
        Boolean(a.selectedOptionId)
      ).length;
      const unansweredQuestions = totalQuestions - answeredCount;
      const incorrectAnswers = answeredCount - correctAnswers;
      const percentage =
        totalQuestions > 0
          ? Math.round((recentAttempt.score / totalQuestions) * 1000) / 10
          : 0;
      const durationSeconds = recentAttempt.durationSeconds ?? quiz.timeLimitSeconds;

      return {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty,
          timeLimitSeconds: quiz.timeLimitSeconds,
        },
        finalizedAttempt: {
          id: recentAttempt.id,
          status: recentAttempt.status as 'COMPLETED' | 'EXPIRED',
          score: recentAttempt.score,
          maxScore: totalQuestions,
          totalQuestions,
          correctAnswers,
          incorrectAnswers,
          unansweredQuestions,
          percentage,
          durationSeconds,
          completedAt: recentAttempt.completedAt?.toISOString() || null,
        },
      };
    }

    // If no attempt ever existed for this user/quiz, create an initial attempt
    const newAttempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        status: 'IN_PROGRESS',
        totalQuestions: quiz.questions.length,
        startedAt: now,
      },
    });

    const authoritativeDeadline = new Date(
      newAttempt.startedAt.getTime() + quiz.timeLimitSeconds * 1000
    );

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        difficulty: quiz.difficulty,
        timeLimitSeconds: quiz.timeLimitSeconds,
      },
      attempt: {
        id: newAttempt.id,
        startedAt: newAttempt.startedAt.toISOString(),
        deadline: authoritativeDeadline.toISOString(),
      },
      questions: quiz.questions,
      savedAnswers: {},
    };
  } catch (error) {
    console.error('Error getting quiz for taking:', error);
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

// ─── Creator Analytics ──────────────────────────────────────────────────────

export interface CreatorQuizStats {
  quizId: string;
  quizTitle: string;
  category: string;
  difficulty: Difficulty;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number | null;
  averagePercentage: number | null;
  highestScore: number;
  lowestScore: number;
  totalQuestions: number;
}

export interface CreatorAttemptRow {
  id: string;
  quizTitle: string;
  quizCategory: string;
  studentName: string;
  studentEmail: string;
  status: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  durationSeconds: number | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface CreatorAnalyticsData {
  quizStats: CreatorQuizStats[];
  attempts: CreatorAttemptRow[];
  overallStats: {
    totalQuizzes: number;
    totalAttempts: number;
    totalCompletedAttempts: number;
    overallAveragePercentage: number | null;
  };
}

/**
 * Fetches comprehensive analytics data for all quizzes created by the given user.
 * Returns per-quiz summary statistics and all individual attempt records.
 */
export async function getCreatorAnalytics(
  creatorId: string
): Promise<CreatorAnalyticsData> {
  try {
    const creatorQuizzes = await prisma.quiz.findMany({
      where: { creatorId },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        questions: {
          select: { id: true },
        },
        attempts: {
          select: {
            id: true,
            status: true,
            score: true,
            totalQuestions: true,
            durationSeconds: true,
            startedAt: true,
            completedAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { startedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const quizStats: CreatorQuizStats[] = [];
    const attempts: CreatorAttemptRow[] = [];
    let totalAttempts = 0;
    let totalCompletedAttempts = 0;
    let percentageSum = 0;
    let percentageCount = 0;

    for (const quiz of creatorQuizzes) {
      const quizAttempts = quiz.attempts;
      const completedAttempts = quizAttempts.filter(
        (a) => a.status === 'COMPLETED' || a.status === 'EXPIRED'
      );
      const scores = completedAttempts.map((a) => a.score);

      const totalQuestions = quiz.questions.length;
      const avgScore =
        scores.length > 0
          ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
          : null;
      const avgPercentage =
        avgScore !== null && totalQuestions > 0
          ? Math.round((avgScore / totalQuestions) * 1000) / 10
          : null;

      quizStats.push({
        quizId: quiz.id,
        quizTitle: quiz.title,
        category: quiz.category,
        difficulty: quiz.difficulty,
        totalAttempts: quizAttempts.length,
        completedAttempts: completedAttempts.length,
        averageScore: avgScore,
        averagePercentage: avgPercentage,
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
        totalQuestions,
      });

      totalAttempts += quizAttempts.length;
      totalCompletedAttempts += completedAttempts.length;

      for (const attempt of quizAttempts) {
        const pct =
          attempt.totalQuestions > 0
            ? Math.round((attempt.score / attempt.totalQuestions) * 1000) / 10
            : 0;

        if (attempt.status === 'COMPLETED' || attempt.status === 'EXPIRED') {
          percentageSum += pct;
          percentageCount++;
        }

        attempts.push({
          id: attempt.id,
          quizTitle: quiz.title,
          quizCategory: quiz.category,
          studentName: attempt.user.name,
          studentEmail: attempt.user.email,
          status: attempt.status,
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          percentage: pct,
          durationSeconds: attempt.durationSeconds,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt,
        });
      }
    }

    return {
      quizStats,
      attempts,
      overallStats: {
        totalQuizzes: creatorQuizzes.length,
        totalAttempts,
        totalCompletedAttempts,
        overallAveragePercentage:
          percentageCount > 0
            ? Math.round((percentageSum / percentageCount) * 10) / 10
            : null,
      },
    };
  } catch (error) {
    console.error('Error fetching creator analytics:', error);
    return {
      quizStats: [],
      attempts: [],
      overallStats: {
        totalQuizzes: 0,
        totalAttempts: 0,
        totalCompletedAttempts: 0,
        overallAveragePercentage: null,
      },
    };
  }
}
