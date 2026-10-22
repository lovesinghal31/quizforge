'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2Icon,
  AlertCircleIcon,
  BookOpenIcon,
  LayoutDashboardIcon,
  TrophyIcon,
  XCircleIcon,
  HelpCircleIcon,
  ClockIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from 'lucide-react';

export interface QuizSubmittedViewProps {
  quizTitle: string;
  quizId?: string;
  status: 'COMPLETED' | 'EXPIRED';
  score?: number;
  maxScore?: number;
  totalQuestions: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  unansweredQuestions?: number;
  totalAnswered?: number;
  percentage?: number;
  durationSeconds?: number;
  completedAt?: string | null;
}

export function QuizSubmittedView({
  quizTitle,
  quizId,
  status,
  score,
  maxScore,
  totalQuestions,
  correctAnswers,
  incorrectAnswers,
  unansweredQuestions,
  totalAnswered,
  percentage,
  durationSeconds,
  completedAt,
}: QuizSubmittedViewProps) {
  const isCompleted = status === 'COMPLETED';

  // Derived fallbacks for robust display
  const derivedScore = score ?? 0;
  const derivedMaxScore = maxScore ?? totalQuestions;
  const derivedPercentage =
    percentage ??
    (derivedMaxScore > 0
      ? Math.round((derivedScore / derivedMaxScore) * 1000) / 10
      : 0);

  const answeredCount =
    totalAnswered ??
    (correctAnswers !== undefined && incorrectAnswers !== undefined
      ? correctAnswers + incorrectAnswers
      : derivedScore);

  const derivedCorrect = correctAnswers ?? derivedScore;
  const derivedUnanswered =
    unansweredQuestions ?? Math.max(0, totalQuestions - answeredCount);
  const derivedIncorrect =
    incorrectAnswers ?? Math.max(0, answeredCount - derivedCorrect);

  const formatDuration = (secs?: number) => {
    if (!secs || secs <= 0) return '< 1 minute';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
  };

  const formattedDate = completedAt
    ? new Date(completedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Recorded';

  // Tier classification
  const getTier = (pct: number) => {
    if (pct >= 80) {
      return {
        label: 'Excellent — Strong Mastery',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        progressClass: '[&>div]:bg-emerald-500',
      };
    }
    if (pct >= 60) {
      return {
        label: 'Passing — Good Understanding',
        badgeClass: 'bg-primary/15 text-primary border-primary/30',
        colorClass: 'text-primary',
        progressClass: '[&>div]:bg-primary',
      };
    }
    return {
      label: 'Needs Review',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      colorClass: 'text-amber-600 dark:text-amber-400',
      progressClass: '[&>div]:bg-amber-500',
    };
  };

  const tier = getTier(derivedPercentage);

  return (
    <div className="mx-auto flex min-h-[75dvh] w-full max-w-3xl items-center justify-center px-4 py-8">
      <Card className="w-full shadow-lg border overflow-hidden">
        {/* Header */}
        <CardHeader className="flex flex-col items-center gap-3 pt-8 pb-4 text-center bg-muted/20 border-b">
          <div
            className={`flex size-14 items-center justify-center rounded-2xl shadow-xs ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2Icon className="size-7" />
            ) : (
              <AlertCircleIcon className="size-7" />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge
              variant={isCompleted ? 'default' : 'secondary'}
              className="text-xs px-2.5 py-0.5"
            >
              {isCompleted ? 'Attempt Completed' : 'Time Expired & Finalized'}
            </Badge>
            <Badge variant="outline" className={`text-xs px-2.5 py-0.5 ${tier.badgeClass}`}>
              {tier.label}
            </Badge>
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
              Assessment Results
            </CardTitle>
            <CardDescription className="max-w-md text-sm text-muted-foreground">
              Quiz: <span className="font-semibold text-foreground">&ldquo;{quizTitle}&rdquo;</span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6 sm:p-8">
          {/* Hero Score Showcase */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs text-center space-y-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Authoritative Score
              </span>
              <div className="flex items-baseline justify-center gap-2">
                <span className={`text-5xl sm:text-6xl font-black tracking-tight tabular-nums ${tier.colorClass}`}>
                  {derivedPercentage}%
                </span>
                <span className="text-xl font-medium text-muted-foreground tabular-nums">
                  ({derivedScore} / {derivedMaxScore} pts)
                </span>
              </div>
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <Progress
                value={derivedPercentage}
                className={`h-3 rounded-full ${tier.progressClass}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>0%</span>
                <span>Pass: 60%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Detailed 4-Metric Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* 1. Correct */}
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-emerald-500/5 p-4 text-center border-emerald-500/20">
              <CheckCircle2Icon className="size-5 text-emerald-600 dark:text-emerald-400 mb-1" />
              <span className="text-xs text-muted-foreground font-medium">Correct</span>
              <p className="text-2xl font-bold tabular-nums text-foreground mt-0.5">
                {derivedCorrect}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {totalQuestions > 0
                  ? `${Math.round((derivedCorrect / totalQuestions) * 100)}% of quiz`
                  : '0%'}
              </span>
            </div>

            {/* 2. Incorrect */}
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-destructive/5 p-4 text-center border-destructive/20">
              <XCircleIcon className="size-5 text-destructive mb-1" />
              <span className="text-xs text-muted-foreground font-medium">Incorrect</span>
              <p className="text-2xl font-bold tabular-nums text-foreground mt-0.5">
                {derivedIncorrect}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {totalQuestions > 0
                  ? `${Math.round((derivedIncorrect / totalQuestions) * 100)}% of quiz`
                  : '0%'}
              </span>
            </div>

            {/* 3. Unanswered */}
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-amber-500/5 p-4 text-center border-amber-500/20">
              <HelpCircleIcon className="size-5 text-amber-600 dark:text-amber-400 mb-1" />
              <span className="text-xs text-muted-foreground font-medium">Unanswered</span>
              <p className="text-2xl font-bold tabular-nums text-foreground mt-0.5">
                {derivedUnanswered}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {totalQuestions > 0
                  ? `${Math.round((derivedUnanswered / totalQuestions) * 100)}% of quiz`
                  : '0%'}
              </span>
            </div>

            {/* 4. Time Taken */}
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-primary/5 p-4 text-center border-primary/20">
              <ClockIcon className="size-5 text-primary mb-1" />
              <span className="text-xs text-muted-foreground font-medium">Time Taken</span>
              <p className="text-2xl font-bold tabular-nums text-foreground mt-0.5">
                {formatDuration(durationSeconds)}
              </p>
              <span className="text-[11px] text-muted-foreground truncate max-w-full">
                {isCompleted ? 'On-time' : 'Time limit'}
              </span>
            </div>
          </div>

          {/* Submission Verification Notice */}
          <div className="rounded-2xl border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 shrink-0 text-primary" />
              <span>
                <strong>PostgreSQL Verified:</strong> Score and answers are immutable and permanently recorded.
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] shrink-0 text-muted-foreground">
              <CalendarIcon className="size-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {quizId && (
              <Link href={`/quizzes/${quizId}`} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full gap-2">
                  <BookOpenIcon className="size-4" />
                  <span>Quiz Overview</span>
                </Button>
              </Link>
            )}

            <Link href="/quizzes" className="w-full sm:w-auto">
              <Button variant="default" className="w-full gap-2">
                <TrophyIcon className="size-4" />
                <span>Explore Quizzes</span>
              </Button>
            </Link>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full gap-2">
                <LayoutDashboardIcon className="size-4" />
                <span>Return to Dashboard</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
