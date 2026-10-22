'use client';

import * as React from 'react';
import { ClockIcon, AlertTriangleIcon } from 'lucide-react';
import { cn } from 'cn';

interface QuizTimerProps {
  deadline: string; // ISO string
  onTimeUp: () => void;
  className?: string;
}

export function QuizTimer({ deadline, onTimeUp, className }: QuizTimerProps) {
  const deadlineMs = React.useMemo(() => new Date(deadline).getTime(), [deadline]);
  const [timeLeftMs, setTimeLeftMs] = React.useState<number>(() =>
    Math.max(0, deadlineMs - Date.now())
  );
  const timeUpFired = React.useRef(false);

  React.useEffect(() => {
    const currentRemaining = Math.max(0, deadlineMs - Date.now());
    if (currentRemaining <= 0 && !timeUpFired.current) {
      timeUpFired.current = true;
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      const remaining = Math.max(0, deadlineMs - Date.now());
      setTimeLeftMs(remaining);

      if (remaining <= 0 && !timeUpFired.current) {
        timeUpFired.current = true;
        clearInterval(timer);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadlineMs, onTimeUp]);

  // Format as HH:MM:SS or MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isLowTime = timeLeftMs <= 120_000 && timeLeftMs > 0; // <= 2 minutes
  const isUrgent = timeLeftMs <= 30_000 && timeLeftMs > 0; // <= 30 seconds

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-semibold tabular-nums transition-colors',
        isUrgent
          ? 'border-destructive/50 bg-destructive/10 text-destructive animate-pulse'
          : isLowTime
            ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            : 'border-border bg-muted/60 text-foreground',
        className
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${formatTime(timeLeftMs)}`}
    >
      {isLowTime ? (
        <AlertTriangleIcon className="size-3.5 shrink-0 animate-bounce" />
      ) : (
        <ClockIcon className="size-3.5 shrink-0 text-primary" />
      )}
      <span>{formatTime(timeLeftMs)}</span>
      {isLowTime && (
        <span className="hidden sm:inline font-sans text-[10px] uppercase font-bold tracking-wider">
          {isUrgent ? 'Hurry!' : 'Ending soon'}
        </span>
      )}
    </div>
  );
}
