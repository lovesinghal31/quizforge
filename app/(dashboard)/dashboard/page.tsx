import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth-server';
import { getDashboardData } from '@/lib/quiz-service';
import { getDifficultyVariant } from '@/components/quiz-card';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PlusCircleIcon,
  CompassIcon,
  BookOpenIcon,
  LayersIcon,
  BarChart3Icon,
  TrophyIcon,
  GlobeIcon,
  ClockIcon,
  ArrowRightIcon,
  HelpCircleIcon,
  SparklesIcon,
} from 'lucide-react';

export const metadata = {
  title: 'Dashboard — QuizForge',
  description:
    'Your QuizForge dashboard. Explore quizzes, track performance, and test your knowledge.',
};

export const instant = false;

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { user } = session;
  const { stats, recentlyPublished, recentAttempts } = await getDashboardData(
    user.id
  );

  const firstName = user.name.split(' ')[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Hero section */}
      <section className="mb-8 rounded-2xl border bg-gradient-to-r from-card via-card to-muted/30 p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-0.5 text-xs font-medium text-muted-foreground shadow-xs">
            <SparklesIcon className="size-3 text-primary" />
            <span>Learning Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Discover verified quizzes across computer science and web development,
            track your test performance, and challenge your technical knowledge.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/quizzes">
              <Button size="lg" className="h-10 px-5 gap-2">
                <CompassIcon data-icon="inline-start" />
                <span>Explore Quizzes</span>
              </Button>
            </Link>
            <Link href="/dashboard/my-quizzes/new">
              <Button variant="outline" size="lg" className="h-10 px-5 gap-2">
                <PlusCircleIcon data-icon="inline-start" />
                <span>Create a quiz</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Summary Statistics cards */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Overview &amp; Metrics</h2>
          <span className="text-xs text-muted-foreground">Updated in real time</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Available Quizzes"
            value={stats.totalPublishedQuizzes}
            icon={<GlobeIcon className="text-primary" />}
            description="Published quizzes ready to take"
          />
          <StatCard
            title="Quizzes Created"
            value={stats.quizzesCreated}
            icon={<LayersIcon className="text-primary" />}
            description="Authored by your account"
          />
          <StatCard
            title="Attempts Completed"
            value={stats.attemptsCompleted}
            icon={<TrophyIcon className="text-primary" />}
            description="Tests you've finished"
          />
          <StatCard
            title="Average Score"
            value={stats.averageScore !== null ? `${stats.averageScore}%` : '—'}
            icon={<BarChart3Icon className="text-primary" />}
            description={
              stats.averageScore !== null
                ? 'Across completed attempts'
                : 'Take a quiz to calculate'
            }
          />
        </div>
      </section>

      {/* Main Grid: Recently Published Quizzes & Quick Actions */}
      <div className="grid gap-8 lg:grid-cols-3 mb-10">
        {/* Recently Published Quizzes (Discovery Recommendations) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Recently Published Quizzes</h2>
              <p className="text-xs text-muted-foreground">New challenges published on QuizForge</p>
            </div>
            <Link href="/quizzes">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                <span>View all</span>
                <ArrowRightIcon className="size-3.5" />
              </Button>
            </Link>
          </div>

          {recentlyPublished.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {recentlyPublished.map((quiz) => {
                const diff = getDifficultyVariant(quiz.difficulty);
                const minutes = Math.round(quiz.timeLimitSeconds / 60);

                return (
                  <Link
                    key={quiz.id}
                    href={`/quizzes/${quiz.id}`}
                    className="group flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/50"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {quiz.category}
                        </Badge>
                        <Badge variant={diff.variant} className={diff.badgeClass}>
                          {diff.label}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {quiz.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {quiz.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HelpCircleIcon className="size-3 text-primary" />
                        {quiz._count.questions} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="size-3 text-primary" />
                        {minutes} mins
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-8 text-center bg-card/40">
              <BookOpenIcon className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No published quizzes yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Published quizzes will appear here for immediate discovery.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
            <p className="text-xs text-muted-foreground">Jump directly to your workspace</p>
          </div>

          <Card>
            <CardContent className="p-3 flex flex-col gap-2">
              <QuickAction
                title="Explore quizzes"
                description="Browse all published tests"
                icon={<CompassIcon />}
                href="/quizzes"
              />
              <QuickAction
                title="My quizzes"
                description="View your authored quizzes"
                icon={<BookOpenIcon />}
                href="/dashboard/my-quizzes"
              />
              <QuickAction
                title="Create a quiz"
                description="Build a new assessment"
                icon={<PlusCircleIcon />}
                href="/dashboard/my-quizzes/new"
              />
              <QuickAction
                title="Quiz history"
                description="Review past attempt logs (Day 4)"
                icon={<ClockIcon />}
                disabled
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User's Recent Attempts Activity */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Your Recent Attempts</CardTitle>
            <CardDescription className="text-xs">
              History of quizzes taken from your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAttempts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between rounded-xl border p-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {attempt.quiz.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <ClockIcon className="mr-1 inline-block size-3" />
                        {new Date(attempt.startedAt).toLocaleDateString(
                          undefined,
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                    <div>
                      {attempt.status === 'COMPLETED' ? (
                        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {attempt.score}/{attempt.totalQuestions} ({Math.round((attempt.score / attempt.totalQuestions) * 100)}%)
                        </span>
                      ) : (
                        <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {attempt.status === 'IN_PROGRESS'
                            ? 'In progress'
                            : 'Expired'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 rounded-full bg-muted p-3">
                  <TrophyIcon className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No quiz activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Your score history and attempt breakdowns will appear here once you
                  take your first quiz.
                </p>
                <Link href="/quizzes" className="mt-4">
                  <Button variant="outline" size="sm">
                    Browse available quizzes
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          {title}
          <span className="[&_svg]:size-5">{icon}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
          {value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  title,
  description,
  icon,
  href,
  disabled = false,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        disabled
          ? 'cursor-not-allowed opacity-50 bg-muted/20'
          : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'
      }`}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      {!disabled && <ArrowRightIcon className="size-4 text-muted-foreground" />}
    </div>
  );

  if (disabled || !href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
