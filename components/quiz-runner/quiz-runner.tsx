'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QuizTimer } from './quiz-timer';
import { QuizSubmittedView } from './quiz-submitted-view';
import { toast } from '@/components/ui/toast';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon, Loader2Icon, SendIcon } from 'lucide-react';
import type { QuizResult } from '@/lib/validations/attempt';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export interface QuestionData {
  id: string;
  text: string;
  options: Array<{
    id: string;
    text: string;
  }>;
}

interface QuizRunnerProps {
  quiz: {
    id: string;
    title: string;
    category: string;
    difficulty: string;
    timeLimitSeconds: number;
  };
  questions: QuestionData[];
}

export function QuizRunner({ quiz, questions }: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<QuizResult | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Handle selecting an option
  const handleSelectOption = (optionId: string) => {
    if (isSubmitting) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  // Submit all answers to the server
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.add({
          title: 'Submission error',
          description: data.error || 'Failed to submit quiz.',
          type: 'error',
        });
        setIsSubmitting(false);
      } else if (data.result) {
        setResult(data.result);
        toast.add({
          title: 'Quiz submitted!',
          description: `You scored ${data.result.score} out of ${data.result.totalQuestions}.`,
          type: 'success',
        });
      }
    } catch {
      toast.add({
        title: 'Network error',
        description: 'Failed to submit quiz. Please try again.',
        type: 'error',
      });
      setIsSubmitting(false);
    }
  };

  // If results are available, show the result card
  if (result) {
    return <QuizSubmittedView quizTitle={quiz.title} result={result} />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Banner: Category, Title, Progress & Timer */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {quiz.category}
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">
              {quiz.difficulty.toLowerCase()}
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
        <div className="self-start sm:self-auto">
          <QuizTimer
            seconds={quiz.timeLimitSeconds}
            onTimeUp={handleSubmit}
            className="text-sm px-4 py-1.5"
          />
        </div>
      </div>

      {/* Active Question Card */}
      <Card className="shadow-xs border overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b flex flex-row items-center justify-between">
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
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Question Text */}
          <p className="text-base sm:text-lg font-medium leading-relaxed text-foreground">
            {currentQuestion.text}
          </p>

          {/* 4 Answer Options */}
          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={handleSelectOption}
            className="gap-3"
          >
            {currentQuestion.options.map((option, optIdx) => {
              const letter = OPTION_LETTERS[optIdx];
              const isSelected = answers[currentQuestion.id] === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <RadioGroupItem value={option.id} id={`opt-${option.id}`} />
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {letter}
                  </span>
                  <label
                    htmlFor={`opt-${option.id}`}
                    className="flex-1 text-sm text-foreground cursor-pointer select-none"
                  >
                    {option.text}
                  </label>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation and Submission Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0 || isSubmitting}
          className="gap-2"
        >
          <ArrowLeftIcon className="size-4" />
          <span>Previous</span>
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 font-semibold shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <SendIcon className="size-4" />
                <span>Submit Quiz</span>
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            disabled={isSubmitting}
            className="gap-2"
          >
            <span>Next Question</span>
            <ArrowRightIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
