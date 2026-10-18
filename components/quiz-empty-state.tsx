import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchXIcon, RefreshCcwIcon } from 'lucide-react';

interface QuizEmptyStateProps {
  hasFilters?: boolean;
  onReset?: () => void;
}

export function QuizEmptyState({ hasFilters = false }: QuizEmptyStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center bg-card/50">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
        <SearchXIcon className="size-7" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {hasFilters ? 'No quizzes match your filters' : 'No quizzes available yet'}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {hasFilters
          ? 'Try adjusting your search terms, changing the category, or selecting another difficulty level.'
          : 'Check back soon! New challenges and assessments are published regularly.'}
      </p>

      {hasFilters && (
        <div className="mt-6">
          <Link href="/quizzes">
            <Button variant="outline" size="sm">
              <RefreshCcwIcon data-icon="inline-start" />
              Reset all filters
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
