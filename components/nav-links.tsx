'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboardIcon, CompassIcon, BookOpenIcon, BarChart3Icon } from 'lucide-react';
import { cn } from 'cn';

interface NavLinksProps {
  isAuthenticated: boolean;
}

export function NavLinks({ isAuthenticated }: NavLinksProps) {
  const pathname = usePathname();

  const links = [
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
          {
            href: '/dashboard/analytics',
            label: 'Analytics',
            icon: BarChart3Icon,
            active: pathname.startsWith('/dashboard/analytics'),
          },
        ]
      : []),
  ];

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href}>
            <Button
              variant={link.active ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'transition-colors',
                link.active && 'bg-secondary font-medium text-foreground'
              )}
            >
              <Icon data-icon="inline-start" />
              <span>{link.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
