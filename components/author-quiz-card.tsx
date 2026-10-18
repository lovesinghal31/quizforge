'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { togglePublishQuizAction } from '@/app/actions/quiz-actions';
import { toast } from '@/components/ui/toast';
import {
  ClockIcon,
  EditIcon,
  ExternalLinkIcon,
  HelpCircleIcon,
  Loader2Icon,
  Trash2Icon,
  UsersIcon,
  UploadCloudIcon,
  EyeOffIcon,
} from 'lucide-react';
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
  updatedAt?: Date | string;
  _count: {
    questions: number;
    attempts: number;
  };
}

interface AuthorQuizCardProps {
  quiz: AuthorQuizItem;
}

const difficultyColors: Record<Difficulty, string> = {
  EASY: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  HARD: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

export function AuthorQuizCard({ quiz }: AuthorQuizCardProps) {
  const router = useRouter();
  const [isTogglingPublish, setIsTogglingPublish] = React.useState(false);
  const [isPublished, setIsPublished] = React.useState(quiz.isPublished);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return mins > 0 ? `${mins}m` : `${seconds}s`;
  };

  const handleTogglePublish = async () => {
    setIsTogglingPublish(true);
    try {
      const res = await togglePublishQuizAction(quiz.id);
      if (res.error) {
        toast.add({
          title: 'Cannot update publish status',
          description: res.error,
          type: 'error',
        });
      } else {
        const nextState = res.isPublished ?? !isPublished;
        setIsPublished(nextState);
        toast.add({
          title: nextState ? 'Quiz Published' : 'Quiz Unpublished',
          description: nextState
            ? 'The quiz is now publicly visible in the catalog.'
            : 'The quiz has been reverted to a private draft.',
          type: 'success',
        });
        router.refresh();
      }
    } catch {
      toast.add({
        title: 'Network Error',
        description: 'Failed to update publication status. Please try again.',
        type: 'error',
      });
    } finally {
      setIsTogglingPublish(false);
    }
  };

  return (
    <Card className="flex flex-col justify-between transition-all duration-200 hover:shadow-md">
      <div>
        <CardHeader className="gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Badge
                variant={isPublished ? 'default' : 'secondary'}
                className="gap-1 px-2 py-0.5 text-xs font-semibold"
              >
                <span
                  className={`size-1.5 rounded-full ${
                    isPublished ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'
                  }`}
                />
                {isPublished ? 'Published' : 'Draft'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {quiz.category}
              </Badge>
            </div>

            <Badge
              variant="outline"
              className={`text-xs uppercase font-medium ${difficultyColors[quiz.difficulty]}`}
            >
              {quiz.difficulty}
            </Badge>
          </div>

          <CardTitle className="line-clamp-2 text-lg font-bold leading-snug">
            {quiz.title}
          </CardTitle>

          <CardDescription className="line-clamp-2 text-xs leading-relaxed">
            {quiz.description || 'No description provided.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2.5 text-center text-xs text-muted-foreground">
            <div className="flex flex-col items-center justify-center gap-0.5">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <HelpCircleIcon className="size-3.5 text-primary" />
                {quiz._count.questions}
              </span>
              <span className="text-[11px]">Questions</span>
            </div>

            <div className="flex flex-col items-center justify-center gap-0.5 border-x">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <ClockIcon className="size-3.5 text-primary" />
                {formatDuration(quiz.timeLimitSeconds)}
              </span>
              <span className="text-[11px]">Time Limit</span>
            </div>

            <div className="flex flex-col items-center justify-center gap-0.5">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <UsersIcon className="size-3.5 text-primary" />
                {quiz._count.attempts}
              </span>
              <span className="text-[11px]">Attempts</span>
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex flex-col gap-2 border-t pt-4">
        {/* Quick action buttons row */}
        <div className="flex w-full items-center justify-between gap-2">
          <Link
            href={`/dashboard/my-quizzes/${quiz.id}/edit`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-xs">
              <EditIcon className="size-3.5" />
              <span>Edit</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleTogglePublish}
            disabled={isTogglingPublish}
            className="gap-1.5 h-8 text-xs"
            title={isPublished ? 'Unpublish quiz' : 'Publish quiz'}
          >
            {isTogglingPublish ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : isPublished ? (
              <>
                <EyeOffIcon className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Unpublish</span>
              </>
            ) : (
              <>
                <UploadCloudIcon className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Publish</span>
              </>
            )}
          </Button>

          <DeleteQuizDialog
            quizId={quiz.id}
            quizTitle={quiz.title}
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

        {/* Public catalog link if published */}
        {isPublished && (
          <Link
            href={`/quizzes/${quiz.id}`}
            className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors py-0.5 w-full text-center"
          >
            <span>View Public Catalog Page</span>
            <ExternalLinkIcon className="size-3" />
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
