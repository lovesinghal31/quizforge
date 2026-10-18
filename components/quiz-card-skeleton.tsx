import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function QuizCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <Skeleton className="h-8 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}

export function QuizGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <QuizCardSkeleton key={i} />
      ))}
    </div>
  );
}
