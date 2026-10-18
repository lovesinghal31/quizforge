import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { QuizForm } from '@/components/quiz-form/quiz-form';

export const metadata = {
  title: 'Create Quiz — QuizForge',
  description: 'Author a new quiz with questions, multiple-choice options, and Viva explanations.',
};

export const instant = false;

export default async function NewQuizPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/my-quizzes/new');
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <QuizForm />
    </div>
  );
}
