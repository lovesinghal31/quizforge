import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth-server';


/**
 * GET /api/dashboard
 * Returns dashboard metrics, recent published quizzes, and personal attempt history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request.headers);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const [
      publishedCount,
      userQuizzesCount,
      userAttemptsCount,
      recentlyPublished,
      recentAttempts,
    ] = await Promise.all([
      prisma.quiz.count({ where: { isPublished: true } }),
      prisma.quiz.count({ where: { creatorId: userId } }),
      prisma.quizAttempt.count({ where: { userId } }),
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
      prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          score: true,
          totalQuestions: true,
          completedAt: true,
          quiz: {
            select: {
              title: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalPublishedQuizzes: publishedCount,
        quizzesCreated: userQuizzesCount,
        attemptsCompleted: userAttemptsCount,
      },
      recentlyPublished,
      recentAttempts,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data.' },
      { status: 500 }
    );
  }
}
