'use client';

import * as React from 'react';
import { ClockIcon, AlertTriangleIcon } from 'lucide-react';
import { cn } from 'cn';

interface QuizTimerProps {
  seconds?: number;
  deadline?: string;
  onTimeUp: () => void;
  className?: string;
}

export function QuizTimer({ seconds = 600, deadline, onTimeUp, className }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState<number>(() => {
    if (deadline) {
      return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
    }
    return seconds;
  });

  const timeUpRef = React.useRef(false);

  React.useEffect(() => {
    if (timeLeft <= 0 && !timeUpRef.current) {
      timeUpRef.current = true;
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!timeUpRef.current) {
            timeUpRef.current = true;
            onTimeUp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp, timeLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(m)}:${pad(s)}`;
  };

  const isLowTime = timeLeft <= 120 && timeLeft > 0;
  const isUrgent = timeLeft <= 30 && timeLeft > 0;

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
      aria-label={`Time remaining: ${formatTime(timeLeft)}`}
    >
      {isLowTime ? (
        <AlertTriangleIcon className="size-3.5 shrink-0 text-amber-500" />
      ) : (
        <ClockIcon className="size-3.5 shrink-0 text-primary" />
      )}
      <span>{formatTime(timeLeft)}</span>
      {isLowTime && (
        <span className="hidden sm:inline font-sans text-[10px] uppercase font-bold tracking-wider">
          {isUrgent ? 'Hurry!' : 'Ending soon'}
        </span>
      )}
    </div>
  );
}
