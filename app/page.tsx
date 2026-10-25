'use client';

import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  SparklesIcon,
  BrainCircuitIcon,
  BarChart3Icon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  LayersIcon,
} from 'lucide-react';

export default function Home() {
  const { data: session } = authClient.useSession();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 via-background to-background py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-xs">
                <SparklesIcon className="size-3.5 text-primary" />
                <span>Next-Gen Interactive Assessment Platform</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Create, Share, and Master Quizzes with{' '}
                <span className="text-primary">QuizForge</span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                The modern full-stack quiz platform designed for students,
                educators, and developers. Build dynamic quizzes, challenge your
                knowledge, and track performance with real-time analytics.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                {session?.user ? (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link href="/dashboard">
                      <Button size="lg" className="h-11 px-6 shadow-sm">
                        Go to Dashboard
                        <ArrowRightIcon data-icon="inline-end" />
                      </Button>
                    </Link>
                    <Link href="/quizzes">
                      <Button variant="outline" size="lg" className="h-11 px-6">
                        Explore Quizzes
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="h-11 px-6 shadow-sm">
                        Get started for free
                        <ArrowRightIcon data-icon="inline-end" />
                      </Button>
                    </Link>
                    <Link href="/quizzes">
                      <Button variant="outline" size="lg" className="h-11 px-6">
                        Explore Quizzes
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2Icon className="size-4 text-primary" />
                  <span>REST API architecture</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2Icon className="size-4 text-primary" />
                  <span>Server-side authoritative evaluation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2Icon className="size-4 text-primary" />
                  <span>HttpOnly session cookies</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Engineered for Performance and Reliability
              </h2>
              <p className="mt-2 text-muted-foreground">
                Everything you need to create engaging assessments and track real learning outcomes.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BrainCircuitIcon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">Quiz Creation</CardTitle>
                  <CardDescription>
                    Custom time limits, multi-format questions, difficulty levels, and categorization via POST /api/quizzes.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BarChart3Icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">REST API</CardTitle>
                  <CardDescription>
                    Clean HTTP endpoints for quizzes, submissions, scoring, and dashboard metrics.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheckIcon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">Ironclad Security</CardTitle>
                  <CardDescription>
                    Better Auth session protection with HttpOnly cookies and database-level user isolation.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <LayersIcon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">Modern Stack</CardTitle>
                  <CardDescription>
                    Built on Next.js 16 App Router, Prisma ORM, PostgreSQL, and shadcn/ui components.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="border-t bg-muted/40 py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to test your knowledge?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Sign up in seconds and start creating quizzes, challenging your friends, and tracking your scores.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href={session?.user ? '/dashboard' : '/register'}>
                <Button size="lg" className="h-11 px-8">
                  {session?.user ? 'Go to Dashboard' : 'Create Free Account'}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© 2026 QuizForge. All rights reserved. Built with Next.js, Better Auth &amp; Prisma.</p>
        </div>
      </footer>
    </div>
  );
}
