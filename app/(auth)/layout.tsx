import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { ModeToggle } from '@/components/mode-toggle';

export const instant = false;

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If user is already authenticated, redirect to dashboard
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ModeToggle />
      </div>
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M12 2 2 7l10 5 10-5-10-5Z" />
              <path d="m2 17 10 5 10-5" />
              <path d="m2 12 10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight">
            QuizForge
          </span>
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
