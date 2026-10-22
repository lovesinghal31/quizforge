import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { getSession } from '@/lib/auth-server';
import { getQuizById } from '@/lib/quiz-service';
import { getDifficultyVariant } from '@/components/quiz-card';
import { StartQuizButton } from '@/components/start-quiz-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ArrowLeftIcon,
  ClockIcon,
  HelpCircleIcon,
  UserIcon,
  InfoIcon,
  BookOpenIcon,
  TrophyIcon,
} from 'lucide-react';

export const instant = false;

interface QuizDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: QuizDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const quiz = await getQuizById(id);

  if (!quiz) {
    return {
      title: 'Quiz Not Found — QuizForge',
    };
  }

  return {
    title: `${quiz.title} — QuizForge`,
    description:
      quiz.description || `Test your knowledge with the ${quiz.title} quiz on QuizForge.`,
  };
}

export default async function QuizDetailsPage({ params }: QuizDetailsPageProps) {
  const { id } = await params;
  const [quiz, session] = await Promise.all([
    getQuizById(id),
    getSession(),
  ]);

  if (!quiz) {
    notFound();
  }

  const isAuthenticated = Boolean(session?.user);
  const difficultyInfo = getDifficultyVariant(quiz.difficulty);
  const minutes = Math.round(quiz.timeLimitSeconds / 60);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back navigation */}
          <div className="mb-6">
            <Link
              href="/quizzes"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="size-4" />
              <span>Back to all quizzes</span>
            </Link>
          </div>

          {/* Quiz Header Banner */}
          <div className="mb-8 rounded-2xl border bg-card p-6 sm:p-8 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">
                <BookOpenIcon data-icon="inline-start" />
                <span>{quiz.category}</span>
              </Badge>
              <Badge
                variant={difficultyInfo.variant}
                className={difficultyInfo.badgeClass}
              >
                {difficultyInfo.label}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {quiz.title}
            </h1>

            <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-2xl">
              {quiz.description ||
                'No description provided for this assessment. Test your knowledge below.'}
            </p>

            {/* Quick Metrics */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HelpCircleIcon className="size-3.5 text-primary" />
                  Questions
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {quiz.questions.length} items
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <ClockIcon className="size-3.5 text-primary" />
                  Time Limit
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {minutes} minutes
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrophyIcon className="size-3.5 text-primary" />
                  Total Attempts
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {quiz._count.attempts} completed
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <UserIcon className="size-3.5" />
                  Created By
                </span>
                <span className="text-sm font-semibold truncate">
                  {quiz.creator.name}
                </span>
              </div>
            </div>

            {/* Action Area */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <StartQuizButton quizId={quiz.id} isAuthenticated={isAuthenticated} />
              <Link href="/quizzes">
                <Button variant="outline" size="lg" className="h-11 px-6 w-full sm:w-auto">
                  Browse more quizzes
                </Button>
              </Link>
            </div>
          </div>

          {/* Assessment Instructions Card */}
          <Card className="mb-8 border shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <InfoIcon className="size-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Assessment Instructions &amp; Rules
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Fixed Structure:</strong> This test contains exactly{' '}
                  <span className="font-semibold text-foreground">{quiz.questions.length} multiple-choice questions</span> with four options each. Exactly one option is correct.
                </li>
                <li>
                  <strong className="text-foreground">Free Navigation:</strong> You can navigate between questions in any order using the <span className="font-semibold text-foreground">Previous</span> and <span className="font-semibold text-foreground">Next</span> buttons, or jump directly via the question navigator.
                </li>
                <li>
                  <strong className="text-foreground">Answer Review:</strong> The interface tracks answered and unanswered questions in real time so you can review your progress before submitting.
                </li>
                <li>
                  <strong className="text-foreground">Strict Countdown Timer:</strong> The timer begins immediately when you click Start Quiz. You have{' '}
                  <span className="font-semibold text-foreground">{minutes} minutes</span> ({quiz.timeLimitSeconds} seconds) to complete your attempt.
                </li>
                <li>
                  <strong className="text-foreground">Automatic Finalization:</strong> If the timer reaches zero before you click submit, your current answers will be automatically submitted by the system.
                </li>
                <li>
                  <strong className="text-foreground">Final Submission:</strong> Once you submit your assessment, all responses are permanently recorded and cannot be revised.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Question Curriculum Outline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Assessment Structure</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {quiz.questions.length} questions in this test
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {quiz.questions.map((q, idx) => (
                  <div key={q.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {q.text}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Multiple choice • {q._count.options} options
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
