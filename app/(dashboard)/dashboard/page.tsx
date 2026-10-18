import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import prisma from '@/lib/prisma';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  PlusCircleIcon,
  BookOpenIcon,
  LayersIcon,
  BarChart3Icon,
  TrophyIcon,
  GlobeIcon,
  ClockIcon,
  ArrowRightIcon,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard — QuizForge',
  description:
    'Your QuizForge dashboard. Create quizzes, track performance, and explore.',
};

export const instant = false;

async function getDashboardStats(userId: string) {
  try {
    const [quizzesCreated, publishedQuizzes, attemptsCompleted, averageScore] =
      await Promise.all([
        prisma.quiz.count({ where: { creatorId: userId } }),
        prisma.quiz.count({
          where: { creatorId: userId, isPublished: true },
        }),
        prisma.quizAttempt.count({
          where: { userId, status: 'COMPLETED' },
        }),
        prisma.quizAttempt
          .aggregate({
            where: { userId, status: 'COMPLETED' },
            _avg: { score: true },
          })
          .then((r) => r._avg.score),
      ]);

    return { quizzesCreated, publishedQuizzes, attemptsCompleted, averageScore };
  } catch {
    // Return safe defaults on database error
    return {
      quizzesCreated: 0,
      publishedQuizzes: 0,
      attemptsCompleted: 0,
      averageScore: null,
    };
  }
}

async function getRecentActivity(userId: string) {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        score: true,
        totalQuestions: true,
        startedAt: true,
        completedAt: true,
        quiz: {
          select: {
            title: true,
          },
        },
      },
    });
    return attempts;
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { user } = session;
  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(user.id),
    getRecentActivity(user.id),
  ]);

  const firstName = user.name.split(' ')[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome section */}
      <section className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Create engaging quizzes, challenge yourself, and track your progress
          with QuizForge.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="lg" disabled>
            <PlusCircleIcon data-icon="inline-start" />
            Create a quiz
          </Button>
          <Button variant="outline" size="lg" disabled>
            <BookOpenIcon data-icon="inline-start" />
            Browse quizzes
          </Button>
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Statistics cards */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-medium">Your statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Quizzes Created"
            value={stats.quizzesCreated}
            icon={<LayersIcon className="text-primary" />}
            description="Total quizzes you've authored"
          />
          <StatCard
            title="Attempts Completed"
            value={stats.attemptsCompleted}
            icon={<TrophyIcon className="text-primary" />}
            description="Quizzes you've finished"
          />
          <StatCard
            title="Average Score"
            value={
              stats.averageScore !== null
                ? `${Math.round(stats.averageScore)}%`
                : '—'
            }
            icon={<BarChart3Icon className="text-primary" />}
            description={
              stats.averageScore !== null
                ? 'Across completed attempts'
                : 'Take a quiz to see your score'
            }
          />
          <StatCard
            title="Published Quizzes"
            value={stats.publishedQuizzes}
            icon={<GlobeIcon className="text-primary" />}
            description="Quizzes available to others"
          />
        </div>
      </section>

      {/* Recent activity & quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>
              Your latest quiz attempts and progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentActivity.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between rounded-xl border p-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
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
                    <div className="flex items-center gap-3">
                      {attempt.status === 'COMPLETED' ? (
                        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          {attempt.score}/{attempt.totalQuestions}
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
                  <BookOpenIcon className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No quiz activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your quiz attempts will appear here once you take your first
                  quiz.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump right into what you need.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <QuickAction
                title="Create a quiz"
                description="Build a new quiz from scratch"
                icon={<PlusCircleIcon />}
                disabled
              />
              <QuickAction
                title="Browse quizzes"
                description="Discover quizzes to take"
                icon={<BookOpenIcon />}
                disabled
              />
              <QuickAction
                title="My quizzes"
                description="View quizzes you've created"
                icon={<LayersIcon />}
                disabled
              />
              <QuickAction
                title="Quiz history"
                description="Review your past attempts"
                icon={<ClockIcon />}
                disabled
              />
            </div>
          </CardContent>
        </Card>
      </div>
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
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
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
          ? 'cursor-not-allowed opacity-50'
          : 'hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
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
