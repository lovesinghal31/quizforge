'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  MenuIcon,
  LayoutDashboardIcon,
  CompassIcon,
  BookOpenIcon,
  LogInIcon,
  UserPlusIcon,
} from 'lucide-react';
import { cn } from 'cn';

interface MobileNavProps {
  isAuthenticated: boolean;
}

export function MobileNav({ isAuthenticated }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const navItems = [
    ...(isAuthenticated
      ? [
          {
            href: '/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboardIcon,
            active: pathname === '/dashboard',
          },
        ]
      : []),
    {
      href: '/quizzes',
      label: 'Explore Quizzes',
      icon: CompassIcon,
      active: pathname.startsWith('/quizzes'),
    },
    ...(isAuthenticated
      ? [
          {
            href: '/dashboard/my-quizzes',
            label: 'My Quizzes',
            icon: BookOpenIcon,
            active: pathname.startsWith('/dashboard/my-quizzes'),
          },
        ]
      : []),
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
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
            <SheetTitle className="text-base font-semibold">QuizForge</SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            Interactive full-stack quiz platform
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  item.active
                    ? 'bg-secondary font-semibold text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {!isAuthenticated && (
            <>
              <Separator className="my-2" />
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LogInIcon className="size-4" />
                <span>Sign in</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <UserPlusIcon className="size-4" />
                <span>Create account</span>
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
