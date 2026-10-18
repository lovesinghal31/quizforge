import Link from 'next/link';
import { getSession } from '@/lib/auth-server';
import { UserMenu } from '@/components/user-menu';
import { ModeToggle } from '@/components/mode-toggle';
import { NavLinks } from '@/components/nav-links';
import { MobileNav } from '@/components/mobile-nav';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu trigger */}
        <MobileNav isAuthenticated={!!session} />

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M12 2 2 7l10 5 10-5-10-5Z" />
              <path d="m2 17 10 5 10-5" />
              <path d="m2 12 10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">
            QuizForge
          </span>
        </Link>

        {/* Desktop Navigation links with active route indicator */}
        <div className="hidden md:flex items-center gap-2">
          <Separator orientation="vertical" className="mx-1 h-5" />
          <NavLinks isAuthenticated={!!session} />
        </div>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ModeToggle />
          {session ? (
            <UserMenu
              user={{
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
              }}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:inline-flex">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
