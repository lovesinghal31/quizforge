'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlayIcon, Loader2Icon, LogInIcon } from 'lucide-react';
import { startQuizAttemptAction } from '@/app/actions/attempt-actions';
import { toast } from '@/components/ui/toast';

interface StartQuizButtonProps {
  quizId: string;
  isAuthenticated: boolean;
}

export function StartQuizButton({ quizId, isAuthenticated }: StartQuizButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleStart = async () => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/quizzes/${quizId}`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await startQuizAttemptAction(quizId);
      if (res.error) {
        toast.add({
          title: 'Unable to start quiz',
          description: res.error,
          type: 'error',
        });
        setIsLoading(false);
      } else {
        router.push(`/quizzes/${quizId}/take`);
      }
    } catch {
      toast.add({
        title: 'Network error',
        description: 'Failed to communicate with the server. Please try again.',
        type: 'error',
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      onClick={handleStart}
      disabled={isLoading}
      className="h-11 px-8 gap-2 font-semibold shadow-xs"
    >
      {isLoading ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          <span>Starting Assessment...</span>
        </>
      ) : !isAuthenticated ? (
        <>
          <LogInIcon className="size-4" />
          <span>Sign In to Start Quiz</span>
        </>
      ) : (
        <>
          <PlayIcon className="size-4" fill="currentColor" />
          <span>Start Quiz Now</span>
        </>
      )}
    </Button>
  );
}
