import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth-server';
import prisma from '@/lib/prisma';
import { AuthorQuizCard, type AuthorQuizItem } from '@/components/author-quiz-card';
import { Button } from '@/components/ui/button';
import { BookOpenIcon, PlusCircleIcon, SparklesIcon } from 'lucide-react';

export const metadata = {
  title: 'My Quizzes — QuizForge',
  description: 'Manage, edit, publish, and review quizzes you have authored on QuizForge.',
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
    orderBy: { updatedAt: 'desc' },
  });

  const publishedCount = userQuizzes.filter((q) => q.isPublished).length;
  const draftCount = userQuizzes.length - publishedCount;

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
            Create, edit, publish, and manage all assessments authored under your account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/my-quizzes/new">
            <Button className="gap-2 shadow-xs">
              <PlusCircleIcon className="size-4" />
              <span>Create New Quiz</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Author summary stats pill if quizzes exist */}
      {userQuizzes.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            Total: {userQuizzes.length}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            {publishedCount} Published
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-muted-foreground" />
            {draftCount} Drafts
          </span>
        </div>
      )}

      {/* Quizzes grid or empty state */}
      {userQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {userQuizzes.map((quiz) => (
            <AuthorQuizCard key={quiz.id} quiz={quiz as AuthorQuizItem} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center bg-card/40">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <BookOpenIcon className="size-7" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight">No quizzes created yet</h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
            You haven&apos;t authored any quizzes yet. Create your first quiz with multiple questions, answer options, and time limits.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/dashboard/my-quizzes/new">
              <Button className="gap-2">
                <PlusCircleIcon className="size-4" />
                <span>Create Your First Quiz</span>
              </Button>
            </Link>
            <Link href="/quizzes">
              <Button variant="outline">
                Explore Catalog
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
