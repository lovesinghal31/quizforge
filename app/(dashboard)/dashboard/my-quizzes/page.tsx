import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth-server';
import prisma from '@/lib/prisma';
import { QuizCard } from '@/components/quiz-card';
import { Button } from '@/components/ui/button';
import { BookOpenIcon, PlusCircleIcon, SparklesIcon } from 'lucide-react';
import type { QuizSummary } from '@/lib/quiz-service';

export const metadata = {
  title: 'My Quizzes — QuizForge',
  description: 'Manage and review the quizzes you have authored on QuizForge.',
};

export const instant = false;

export default async function MyQuizzesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { user } = session;

  const userQuizzes = await prisma.quiz.findMany({
    where: { creatorId: user.id },
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
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-3 py-0.5 text-xs font-medium text-muted-foreground">
            <SparklesIcon className="size-3 text-primary" />
            <span>Author Workspace</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
            <BookOpenIcon className="size-7 text-primary" />
            My Quizzes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View, manage, and inspect all quizzes authored under your account.
          </p>
        </div>

        <div>
          <Button disabled className="gap-2">
            <PlusCircleIcon data-icon="inline-start" />
            <span>Create new quiz</span>
          </Button>
        </div>
      </div>

      {/* Quizzes list or empty state */}
      {userQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(userQuizzes as QuizSummary[]).map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center bg-card/40">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <BookOpenIcon className="size-7" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight">No quizzes created yet</h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
            You haven&apos;t authored any quizzes yet. In the meantime, explore published quizzes created by instructors.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/quizzes">
              <Button variant="default" size="sm">
                Explore Quizzes
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
