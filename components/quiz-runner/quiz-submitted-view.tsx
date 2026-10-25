'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2Icon, CompassIcon, LayoutDashboardIcon, TrophyIcon } from 'lucide-react';
import type { QuizResult } from '@/lib/validations/attempt';

interface QuizSubmittedViewProps {
  quizTitle: string;
  result: QuizResult;
}

export function QuizSubmittedView({ quizTitle, result }: QuizSubmittedViewProps) {
  const { score, totalQuestions, percentage } = result;

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-xl items-center justify-center px-4 py-8">
      <Card className="w-full shadow-lg border overflow-hidden">
        <CardHeader className="flex flex-col items-center gap-3 pt-8 pb-4 text-center bg-muted/20 border-b">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
            <TrophyIcon className="size-7" />
          </div>

          <Badge variant="default" className="text-xs px-2.5 py-0.5">
            Quiz Completed
          </Badge>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
              Assessment Results
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Quiz: <span className="font-semibold text-foreground">&ldquo;{quizTitle}&rdquo;</span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6 sm:p-8">
          {/* Main Score Box */}
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-muted/30 p-6 text-center">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Final Score
            </span>
            <div className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight text-primary tabular-nums">
              {score} <span className="text-xl sm:text-2xl font-medium text-muted-foreground">/ {totalQuestions}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-semibold">{percentage}% Accuracy</span>
            </div>
            <div className="w-full max-w-xs mt-3">
              <Progress value={percentage} className="h-2.5" />
            </div>
          </div>

          {/* Quick feedback message */}
          <div className="flex items-center gap-2.5 rounded-xl border bg-card p-3 text-sm text-muted-foreground">
            <CheckCircle2Icon className="size-5 text-emerald-500 shrink-0" />
            <span>
              {percentage >= 70
                ? 'Great job! You have demonstrated strong understanding of the topics.'
                : 'Good attempt! Review the questions and try again to improve your score.'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link href="/quizzes" className="w-full sm:flex-1">
              <Button variant="default" className="w-full gap-2">
                <CompassIcon className="size-4" />
                <span>Explore More Quizzes</span>
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full sm:flex-1">
              <Button variant="outline" className="w-full gap-2">
                <LayoutDashboardIcon className="size-4" />
                <span>Go to Dashboard</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
