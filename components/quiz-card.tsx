import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ClockIcon,
  HelpCircleIcon,
  UserIcon,
  ArrowRightIcon,
  BookOpenIcon,
} from 'lucide-react';
import type { Difficulty } from '@/generated/prisma/client';

export interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: Difficulty;
  timeLimitSeconds: number;
  createdAt?: string | Date;
  creator: {
    name: string;
  };
  _count: {
    questions: number;
    attempts?: number;
  };
}

interface QuizCardProps {
  quiz: QuizSummary;
}

export function getDifficultyVariant(difficulty: Difficulty) {
  switch (difficulty) {
    case 'EASY':
      return {
        variant: 'secondary' as const,
        label: 'Easy',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      };
    case 'MEDIUM':
      return {
        variant: 'outline' as const,
        label: 'Medium',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      };
    case 'HARD':
      return {
        variant: 'destructive' as const,
        label: 'Hard',
        badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
      };
    default:
      return {
        variant: 'outline' as const,
        label: difficulty,
        badgeClass: '',
      };
  }
}

export function QuizCard({ quiz }: QuizCardProps) {
  const difficultyInfo = getDifficultyVariant(quiz.difficulty);
  const minutes = Math.round(quiz.timeLimitSeconds / 60);

  return (
    <Card className="group flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="space-y-2.5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="font-normal text-muted-foreground">
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

        <div>
          <CardTitle className="line-clamp-1 text-base font-semibold group-hover:text-primary transition-colors">
            {quiz.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {quiz.description || 'No description provided for this quiz.'}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="py-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <HelpCircleIcon className="size-3.5 text-primary" />
            <span>{quiz._count.questions} questions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5 text-primary" />
            <span>{minutes} mins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserIcon className="size-3.5" />
            <span className="truncate max-w-[120px]">{quiz.creator.name}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <Link href={`/quizzes/${quiz.id}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full justify-between group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <span>View details</span>
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
