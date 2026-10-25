'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuizForm, type QuizInitialData } from '@/components/quiz-form/quiz-form';
import { Button } from '@/components/ui/button';
import { Loader2Icon, ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

interface FetchedQuiz {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimitSeconds: number;
  isPublished: boolean;
  questions: Array<{
    id: string;
    text: string;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
}

function EditQuizContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [initialData, setInitialData] = useState<QuizInitialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadQuizForEdit() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/quizzes/${id}?forEdit=true`);
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 403) {
          setError('You do not have permission to edit this quiz.');
          return;
        }
        if (res.status === 404) {
          setError('Quiz not found.');
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch quiz for editing.');
        }

        const data: { quiz: FetchedQuiz } = await res.json();
        const quiz = data.quiz;

        const formatted: QuizInitialData = {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty,
          timeLimitMinutes: Math.max(1, Math.round(quiz.timeLimitSeconds / 60)),
          isPublished: quiz.isPublished,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            text: q.text,
            options: q.options.map((opt) => ({
              id: opt.id,
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          })),
        };

        setInitialData(formatted);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading quiz.');
      } finally {
        setIsLoading(false);
      }
    }

    loadQuizForEdit();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <Loader2Icon className="size-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading quiz details for editing...</p>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <p className="text-destructive font-medium mb-4">{error || 'Unable to load quiz.'}</p>
        <Link href="/dashboard/my-quizzes">
          <Button variant="outline" className="gap-2">
            <ArrowLeftIcon className="size-4" />
            <span>Back to My Quizzes</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <QuizForm initialData={initialData} isEditing />
    </div>
  );
}

export default function EditQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
          <Loader2Icon className="size-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading quiz editor...</p>
        </div>
      }
    >
      <EditQuizContent />
    </Suspense>
  );
}
