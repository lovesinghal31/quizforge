import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { getAuthorQuizById } from '@/lib/quiz-service';
import { QuizForm, type QuizInitialData } from '@/components/quiz-form/quiz-form';

export const metadata = {
  title: 'Edit Quiz — QuizForge',
  description: 'Update and manage your authored quiz and questions.',
};

export const instant = false;

interface EditQuizPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditQuizPage({ params }: EditQuizPageProps) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;
  const quiz = await getAuthorQuizById(id, session.user.id);

  if (!quiz) {
    notFound();
  }

  const initialData: QuizInitialData = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    difficulty: quiz.difficulty,
    timeLimitMinutes: Math.max(1, Math.round(quiz.timeLimitSeconds / 60)),
    isPublished: quiz.isPublished,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      explanation: q.explanation,
      position: q.position,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        position: opt.position,
      })),
    })),
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <QuizForm initialData={initialData} isEditing />
    </div>
  );
}
