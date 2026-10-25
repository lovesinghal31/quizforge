'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlayIcon, LogInIcon } from 'lucide-react';

interface StartQuizButtonProps {
  quizId: string;
  isAuthenticated: boolean;
}

export function StartQuizButton({ quizId, isAuthenticated }: StartQuizButtonProps) {
  if (!isAuthenticated) {
    return (
      <Link href={`/login?callbackUrl=/quizzes/${quizId}`}>
        <Button size="lg" className="h-11 px-8 gap-2 font-semibold shadow-xs">
          <LogInIcon className="size-4" />
          <span>Sign In to Start Quiz</span>
        </Button>
      </Link>
    );
  }

  return (
    <Link href={`/quizzes/${quizId}/take`}>
      <Button size="lg" className="h-11 px-8 gap-2 font-semibold shadow-xs">
        <PlayIcon className="size-4" fill="currentColor" />
        <span>Start Quiz Now</span>
      </Button>
    </Link>
  );
}
