'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { QuizRunner, type QuestionData } from '@/components/quiz-runner/quiz-runner';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Loader2Icon, ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

interface QuizTakeData {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  timeLimitSeconds: number;
  questions: QuestionData[];
}

function QuizTakeContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const [quiz, setQuiz] = useState<QuizTakeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSessionPending) return;

    if (!session?.user) {
      router.push(`/login?callbackUrl=/quizzes/${id}/take`);
      return;
    }

    if (!id) return;

    async function loadQuizForTaking() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/quizzes/${id}`);
        if (res.status === 404) {
          setError('Quiz not found or not published.');
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to load quiz assessment.');
        }

        const data = await res.json();
        if (!data.quiz || data.quiz.questions.length === 0) {
          setError('This quiz has no questions available.');
          return;
        }

        setQuiz(data.quiz);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading quiz.');
      } finally {
        setIsLoading(false);
      }
    }

    loadQuizForTaking();
  }, [id, session, isSessionPending, router]);

  if (isSessionPending || isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2Icon className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Preparing your assessment...</p>
        </div>
      </main>
    );
  }

  if (error || !quiz) {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-center py-20">
        <div>
          <h1 className="text-2xl font-bold mb-2">Unable to Start Quiz</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {error || 'The quiz could not be loaded.'}
          </p>
          <Link href="/quizzes">
            <Button variant="outline" className="gap-2">
              <ArrowLeftIcon className="size-4" />
              <span>Back to quizzes</span>
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 py-4 sm:py-8">
      <QuizRunner quiz={quiz} questions={quiz.questions} />
    </main>
  );
}

export default function QuizTakePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2Icon className="size-8 animate-spin text-primary" />
          </div>
        }
      >
        <QuizTakeContent />
      </Suspense>
    </div>
  );
}
