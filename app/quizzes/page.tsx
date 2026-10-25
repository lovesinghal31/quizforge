'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { QuizCard, type QuizSummary } from '@/components/quiz-card';
import { QuizFilters } from '@/components/quiz-filters';
import { QuizEmptyState } from '@/components/quiz-empty-state';
import { CompassIcon, SparklesIcon, Loader2Icon } from 'lucide-react';

function QuizzesContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const difficulty = searchParams.get('difficulty') || 'all';

  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = useCallback(async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams();
      if (q) query.set('q', q);
      if (category && category !== 'all') query.set('category', category);
      if (difficulty && difficulty !== 'all') query.set('difficulty', difficulty);

      const res = await fetch(`/api/quizzes?${query.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch quizzes.');
      }

      const data = await res.json();
      setQuizzes(data.quizzes || []);
      setTotalCount(data.totalCount || 0);
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching quizzes.');
    } finally {
      setIsLoading(false);
    }
  }, [q, category, difficulty]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const hasActiveFilters = Boolean(
    q ||
      (category && category !== 'all') ||
      (difficulty && difficulty !== 'all')
  );

  return (
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
          <QuizFilters
            categories={categories}
            initialSearch={q}
            initialCategory={category}
            initialDifficulty={difficulty}
          />
        </div>

        {/* Content list or states */}
        {isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <Loader2Icon className="size-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Fetching quizzes from /api/quizzes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive font-medium mb-3">{error}</p>
          </div>
        ) : quizzes.length > 0 ? (
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
  );
}

export default function QuizzesPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <Loader2Icon className="size-8 animate-spin text-primary" />
          </div>
        }
      >
        <QuizzesContent />
      </Suspense>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© 2026 QuizForge. All rights reserved. Built with Next.js, Better Auth &amp; Prisma.</p>
        </div>
      </footer>
    </div>
  );
}
