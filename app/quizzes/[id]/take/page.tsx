import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { getQuizForTaking } from '@/lib/quiz-service';
import { QuizRunner } from '@/components/quiz-runner/quiz-runner';
import { QuizSubmittedView } from '@/components/quiz-runner/quiz-submitted-view';
import { Navbar } from '@/components/navbar';

export const metadata = {
  title: 'Quiz in Progress — QuizForge',
  description: 'Active timed assessment on QuizForge.',
};

export const instant = false;

interface QuizTakePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuizTakePage({ params }: QuizTakePageProps) {
  const session = await getSession();
  const { id } = await params;

  if (!session?.user) {
    redirect(`/login?callbackUrl=/quizzes/${id}`);
  }

  const takingData = await getQuizForTaking(id, session.user.id);

  if (!takingData) {
    notFound();
  }

  // If the user's attempt has already been submitted or expired, show the finalized screen
  if (takingData.finalizedAttempt) {
    return (
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 py-4 sm:py-8">
          <QuizSubmittedView
            quizTitle={takingData.quiz.title}
            quizId={takingData.quiz.id}
            status={takingData.finalizedAttempt.status}
            score={takingData.finalizedAttempt.score}
            maxScore={takingData.finalizedAttempt.maxScore}
            totalQuestions={takingData.finalizedAttempt.totalQuestions}
            correctAnswers={takingData.finalizedAttempt.correctAnswers}
            incorrectAnswers={takingData.finalizedAttempt.incorrectAnswers}
            unansweredQuestions={takingData.finalizedAttempt.unansweredQuestions}
            percentage={takingData.finalizedAttempt.percentage}
            durationSeconds={takingData.finalizedAttempt.durationSeconds}
            completedAt={takingData.finalizedAttempt.completedAt}
          />
        </main>
      </div>
    );
  }

  if (!takingData.attempt || !takingData.questions) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 py-4 sm:py-8">
        <QuizRunner
          quiz={takingData.quiz}
          attempt={takingData.attempt}
          questions={takingData.questions}
          initialAnswers={takingData.savedAnswers}
        />
      </main>
    </div>
  );
}
