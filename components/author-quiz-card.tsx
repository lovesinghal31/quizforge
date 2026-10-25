'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeleteQuizDialog } from '@/components/quiz-form/delete-quiz-dialog';
import { ClockIcon, EditIcon, HelpCircleIcon, Trash2Icon, ExternalLinkIcon } from 'lucide-react';
import type { Difficulty } from '@/generated/prisma/client';

export interface AuthorQuizItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: Difficulty;
  timeLimitSeconds: number;
  isPublished: boolean;
  createdAt: Date | string;
  _count: {
    questions: number;
    attempts: number;
  };
}

interface AuthorQuizCardProps {
  quiz: AuthorQuizItem;
  onDeleted?: () => void;
}

export function AuthorQuizCard({ quiz, onDeleted }: AuthorQuizCardProps) {
  const mins = Math.round(quiz.timeLimitSeconds / 60);

  return (
    <Card className="flex flex-col justify-between transition-all duration-200 hover:shadow-md">
      <div>
        <CardHeader className="gap-2 pb-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-xs">
              {quiz.category}
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">
              {quiz.difficulty.toLowerCase()}
            </Badge>
          </div>

          <CardTitle className="line-clamp-1 text-base font-bold leading-snug">
            {quiz.title}
          </CardTitle>

          <CardDescription className="line-clamp-2 text-xs leading-relaxed">
            {quiz.description || 'No description provided.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 pb-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <HelpCircleIcon className="size-3.5 text-primary" />
              {quiz._count.questions} questions
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3.5 text-primary" />
              {mins} mins
            </span>
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between gap-2 border-t pt-3">
        <Link href={`/quizzes/${quiz.id}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
          <span>View Quiz</span>
          <ExternalLinkIcon className="size-3" />
        </Link>

        <div className="flex items-center gap-1.5">
          <Link href={`/dashboard/my-quizzes/${quiz.id}/edit`}>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <EditIcon className="size-3.5" />
              <span>Edit</span>
            </Button>
          </Link>

          <DeleteQuizDialog
            quizId={quiz.id}
            quizTitle={quiz.title}
            onSuccess={onDeleted}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Delete quiz"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            }
          />
        </div>
      </CardFooter>
    </Card>
  );
}
