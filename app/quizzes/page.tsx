import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { QuizCard } from '@/components/quiz-card';
import { QuizFilters } from '@/components/quiz-filters';
import { QuizEmptyState } from '@/components/quiz-empty-state';
import { getPublishedQuizzes } from '@/lib/quiz-service';
import { CompassIcon, SparklesIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Explore Quizzes — QuizForge',
  description:
    'Discover and take published engineering, web development, and computer science quizzes on QuizForge.',
};

export const instant = false;

interface QuizzesPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    difficulty?: string;
    page?: string;
  }>;
}

export default async function QuizzesPage({ searchParams }: QuizzesPageProps) {
  const params = await searchParams;
  const q = params.q || '';
  const category = params.category || 'all';
  const difficulty = params.difficulty || 'all';
  const currentPage = params.page ? parseInt(params.page, 10) : 1;

  const { quizzes, totalCount, categories } = await getPublishedQuizzes({
    q,
    category,
    difficulty,
    page: currentPage,
    pageSize: 12,
  });

  const hasActiveFilters = Boolean(
    q ||
      (category && category !== 'all') ||
      (difficulty && difficulty !== 'all')
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header section */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-3 py-0.5 text-xs font-medium text-muted-foreground">
              <SparklesIcon className="size-3 text-primary" />
              <span>Quiz Discovery</span>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl flex items-center gap-2.5">
                  <CompassIcon className="size-8 text-primary" />
                  Explore Quizzes
                </h1>
                <p className="mt-2 text-base text-muted-foreground max-w-2xl">
                  Challenge yourself with curated assessments across Programming, Web
                  Development, Databases, Networks, and Computer Science.
                </p>
              </div>
              <div className="text-sm font-medium text-muted-foreground shrink-0">
                {totalCount} {totalCount === 1 ? 'quiz' : 'quizzes'} available
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mb-8">
            <Suspense fallback={<div className="h-16 w-full rounded-2xl bg-muted animate-pulse" />}>
              <QuizFilters
                categories={categories}
                initialSearch={q}
                initialCategory={category}
                initialDifficulty={difficulty}
              />
            </Suspense>
          </div>

          {/* Quiz Cards Grid */}
          {quizzes.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          ) : (
            <QuizEmptyState hasFilters={hasActiveFilters} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© 2026 QuizForge. All rights reserved. Built with Next.js, Better Auth &amp; Prisma.</p>
        </div>
      </footer>
    </div>
  );
}
