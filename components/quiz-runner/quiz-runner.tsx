'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QuizTimer } from './quiz-timer';
import { QuizSubmittedView } from './quiz-submitted-view';
import {
  submitQuizAttemptAction,
  saveAttemptAnswerAction,
  type SubmitAttemptResponse,
} from '@/app/actions/attempt-actions';
import { toast } from '@/components/ui/toast';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
  Loader2Icon,
  SendIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import type { SafeQuestionDTO } from '@/lib/quiz-service';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

interface QuizRunnerProps {
  quiz: {
    id: string;
    title: string;
    category: string;
    difficulty: string;
    timeLimitSeconds: number;
  };
  attempt: {
    id: string;
    startedAt: string;
    deadline: string;
  };
  questions: SafeQuestionDTO[];
  initialAnswers?: Record<string, string>;
}

export function QuizRunner({
  quiz,
  attempt,
  questions,
  initialAnswers = {},
}: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`quizforge_attempt_${attempt.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            return { ...initialAnswers, ...parsed };
          }
        }
      } catch {
        // Restricted storage fallback
      }
    }
    return initialAnswers;
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTimeExpired, setIsTimeExpired] = React.useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [submittedResult, setSubmittedResult] = React.useState<SubmitAttemptResponse | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter((k) => Boolean(answers[k])).length;
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Select an option for current question
  const handleSelectOption = (optionId: string) => {
    if (isSubmitting || isTimeExpired) return;

    setAnswers((prev) => {
      const updated = {
        ...prev,
        [currentQuestion.id]: optionId,
      };
      try {
        localStorage.setItem(`quizforge_attempt_${attempt.id}`, JSON.stringify(updated));
      } catch {
        // Ignore localStorage quota/permission errors
      }
      return updated;
    });

    // Save answer to server in background
    saveAttemptAnswerAction({
      attemptId: attempt.id,
      questionId: currentQuestion.id,
      selectedOptionId: optionId,
    }).catch(() => {
      // Background save failure will be caught and resolved on final submission
    });
  };

  // Submission executor
  const performSubmission = async (forcedExpired = false) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const answersPayload = questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: answers[q.id] || null,
    }));

    try {
      const res = await submitQuizAttemptAction({
        attemptId: attempt.id,
        answers: answersPayload,
      });

      if (res.error) {
        setErrorMessage(res.error);
        toast.add({
          title: 'Submission failed',
          description: res.error,
          type: 'error',
        });
        setIsSubmitting(false);
      } else {
        try {
          localStorage.removeItem(`quizforge_attempt_${attempt.id}`);
        } catch {
          // Ignore storage cleanup errors
        }

        setConfirmDialogOpen(false);
        setSubmittedResult({
          ...res,
          success: true,
          status: res.status || (forcedExpired ? 'EXPIRED' : 'COMPLETED'),
          totalAnswered: res.totalAnswered ?? answeredCount,
          totalQuestions: res.totalQuestions ?? totalQuestions,
        });
        toast.add({
          title: 'Quiz Submitted',
          description: forcedExpired
            ? 'Time expired. Your attempt has been finalized.'
            : 'Your attempt has been submitted successfully.',
          type: 'success',
        });
      }
    } catch {
      setErrorMessage('Network or server error while submitting. Please try again.');
      toast.add({
        title: 'Submission error',
        description: 'Failed to communicate with the server. Please try again.',
        type: 'error',
      });
      setIsSubmitting(false);
    }
  };

  // Called when timer reaches 0
  const handleTimeUp = React.useCallback(() => {
    setIsTimeExpired(true);
    toast.add({
      title: 'Time is up!',
      description: 'Your time limit has ended. Submitting your current answers...',
      type: 'warning',
    });
    performSubmission(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, attempt.id, questions]);

  // If already submitted, display the confirmation view
  if (submittedResult?.success) {
    return (
      <QuizSubmittedView
        quizTitle={quiz.title}
        quizId={quiz.id}
        status={submittedResult.status ?? 'COMPLETED'}
        score={submittedResult.score}
        maxScore={submittedResult.maxScore}
        totalQuestions={submittedResult.totalQuestions ?? totalQuestions}
        correctAnswers={submittedResult.correctAnswers}
        incorrectAnswers={submittedResult.incorrectAnswers}
        unansweredQuestions={submittedResult.unansweredQuestions}
        totalAnswered={submittedResult.totalAnswered}
        percentage={submittedResult.percentage}
        durationSeconds={submittedResult.durationSeconds}
        completedAt={submittedResult.completedAt}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner / Assessment Header */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {quiz.category}
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>In Progress</span>
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl line-clamp-1">
            {quiz.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            Question <span className="font-semibold text-foreground">{currentIndex + 1}</span> of{' '}
            <span className="font-semibold text-foreground">{totalQuestions}</span>
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <QuizTimer
            deadline={attempt.deadline}
            onTimeUp={handleTimeUp}
            className="text-sm px-4 py-1.5"
          />
        </div>
      </div>

      {/* Global Error Alert if any */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Submission Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Main Grid: Question Card (left 8 cols) + Question Navigator (right 4 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Active Question View */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="shadow-xs border overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex items-center justify-between">
                <Badge variant="default" className="font-semibold px-2.5 py-0.5 text-xs">
                  Question {currentIndex + 1}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {answers[currentQuestion.id] ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2Icon className="size-3.5" />
                      <span>Answered</span>
                    </span>
                  ) : (
                    <span>Unanswered</span>
                  )}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Question Statement */}
              <p className="text-base sm:text-lg font-medium leading-relaxed text-foreground">
                {currentQuestion.text}
              </p>

              {/* 4 Selectable Options */}
              <div className="space-y-3 pt-2">
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={handleSelectOption}
                  disabled={isSubmitting || isTimeExpired}
                  className="gap-3"
                >
                  {currentQuestion.options.map((option, optIdx) => {
                    const letter = OPTION_LETTERS[optIdx];
                    const isSelected = answers[currentQuestion.id] === option.id;

                    return (
                      <div
                        key={option.id}
                        role="button"
                        tabIndex={isSubmitting || isTimeExpired ? -1 : 0}
                        aria-pressed={isSelected}
                        onClick={() => handleSelectOption(option.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            handleSelectOption(option.id);
                          }
                        }}
                        className={`group relative flex cursor-pointer items-center gap-3.5 rounded-2xl border p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30 dark:bg-primary/10'
                            : 'border-border/80 hover:border-border hover:bg-muted/40'
                        } ${isSubmitting || isTimeExpired ? 'pointer-events-none opacity-60' : ''}`}
                      >
                        <div className="flex items-center">
                          <RadioGroupItem
                            value={option.id}
                            id={`option-${option.id}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <span
                          className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                          }`}
                        >
                          {letter}
                        </span>

                        <label
                          htmlFor={`option-${option.id}`}
                          className="flex-1 text-sm font-normal text-foreground leading-relaxed cursor-pointer select-none"
                        >
                          {option.text}
                        </label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons Row */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0 || isSubmitting}
              className="gap-2"
            >
              <ArrowLeftIcon className="size-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <Button
                  variant="default"
                  size="default"
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <span>Next Question</span>
                  <ArrowRightIcon className="size-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="default"
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={isSubmitting}
                  className="gap-2 bg-primary font-semibold"
                >
                  <SendIcon className="size-4" />
                  <span>Review &amp; Submit</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Question Navigator Grid & Progress Overview */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-xs border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Quiz Navigator</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {answeredCount} / {totalQuestions} Answered
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <Progress value={progressPercent} className="h-2" />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{progressPercent}% completed</span>
                  <span>{unansweredCount} remaining</span>
                </div>
              </div>

              {/* Numbered Questions Grid */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Jump to question</span>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isAnswered = Boolean(answers[q.id]);

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        disabled={isSubmitting}
                        className={`flex size-10 items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                          isCurrent
                            ? 'ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground font-bold shadow-xs'
                            : isAnswered
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                              : 'border border-dashed text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                        title={`Question ${idx + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-muted-foreground border-t">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-primary" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/40" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm border border-dashed" />
                  <span>Unanswered</span>
                </div>
              </div>

              {/* Submit CTA button inside sidebar */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={isSubmitting || isTimeExpired}
                  className="w-full gap-2 shadow-xs"
                >
                  <SendIcon className="size-3.5" />
                  <span>Submit Quiz</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Viva Note Card */}
          <div className="rounded-2xl border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
            <HelpCircleIcon className="size-4 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Assessment Rules</p>
              <p className="mt-0.5">
                Each question has exactly 4 options with single-choice selection.
                You can revisit any question before the timer elapses.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Confirmation Alert Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <SendIcon className="size-5" />
            </div>
            <AlertDialogTitle className="text-left text-lg font-semibold">
              Submit Quiz Attempt?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-sm text-muted-foreground leading-relaxed space-y-2">
              <span>
                You have answered <span className="font-semibold text-foreground">{answeredCount}</span> of{' '}
                <span className="font-semibold text-foreground">{totalQuestions}</span> questions.
              </span>
              {unansweredCount > 0 && (
                <span className="block text-amber-600 dark:text-amber-400 font-medium">
                  Warning: You have {unansweredCount} unanswered question{unansweredCount === 1 ? '' : 's'}. Unanswered questions will receive no credit.
                </span>
              )}
              <span className="block pt-1 text-xs">
                Once submitted, your responses will be permanently recorded and cannot be revised.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isSubmitting}>Continue Quiz</AlertDialogCancel>
            <Button
              onClick={() => performSubmission(false)}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <SendIcon className="size-4" />
                  <span>Confirm &amp; Submit</span>
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
