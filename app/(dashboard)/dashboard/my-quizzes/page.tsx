'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AuthorQuizCard, type AuthorQuizItem } from '@/components/author-quiz-card';
import { Button } from '@/components/ui/button';
import { BookOpenIcon, PlusCircleIcon, SparklesIcon, Loader2Icon } from 'lucide-react';

export default function MyQuizzesPage() {
  const [quizzes, setQuizzes] = useState<AuthorQuizItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyQuizzes = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/quizzes?mine=true');
      if (!res.ok) {
        throw new Error('Failed to fetch authored quizzes.');
      }
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyQuizzes();
  }, [fetchMyQuizzes]);

  const publishedCount = quizzes.filter((q) => q.isPublished).length;
  const draftCount = quizzes.length - publishedCount;

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
            Create, edit, publish, and manage all assessments authored under your account. Fetched via /api/quizzes?mine=true.
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

      {isLoading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center">
          <Loader2Icon className="size-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading your authored quizzes...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive font-medium mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchMyQuizzes}>
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Author summary stats pill if quizzes exist */}
          {quizzes.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Total: {quizzes.length}
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
          {quizzes.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <AuthorQuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onDeleted={fetchMyQuizzes}
                />
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
        </>
      )}
    </div>
  );
}
