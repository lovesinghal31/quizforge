import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { getCreatorAnalytics } from '@/lib/quiz-service';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';

export const metadata = {
  title: 'Analytics — QuizForge',
  description:
    'View detailed analytics and results for all quizzes you have authored on QuizForge.',
};

export const instant = false;

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { user } = session;
  const analytics = await getCreatorAnalytics(user.id);

  // Serialize dates for client component
  const serializedAttempts = analytics.attempts.map((a) => ({
    ...a,
    startedAt: a.startedAt.toISOString(),
    completedAt: a.completedAt?.toISOString() ?? null,
  }));

  return (
    <AnalyticsDashboard
      quizStats={analytics.quizStats}
      attempts={serializedAttempts}
      overallStats={analytics.overallStats}
    />
  );
}
