'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3Icon,
  UsersIcon,
  TrophyIcon,
  BookOpenIcon,
  ClockIcon,
  ArrowUpDownIcon,
  SearchIcon,
  ActivityIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { CreatorQuizStats } from '@/lib/quiz-service';
import type { Difficulty } from '@/generated/prisma/client';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SerializedAttempt {
  id: string;
  quizTitle: string;
  quizCategory: string;
  studentName: string;
  studentEmail: string;
  status: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  durationSeconds: number | null;
  startedAt: string;
  completedAt: string | null;
}

interface OverallStats {
  totalQuizzes: number;
  totalAttempts: number;
  totalCompletedAttempts: number;
  overallAveragePercentage: number | null;
}

interface AnalyticsDashboardProps {
  quizStats: CreatorQuizStats[];
  attempts: SerializedAttempt[];
  overallStats: OverallStats;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

type SortField =
  | 'studentName'
  | 'quizTitle'
  | 'score'
  | 'percentage'
  | 'status'
  | 'startedAt';

function getDifficultyBadge(difficulty: Difficulty) {
  switch (difficulty) {
    case 'EASY':
      return (
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-50/50">
          Easy
        </Badge>
      );
    case 'MEDIUM':
      return (
        <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-50/50">
          Medium
        </Badge>
      );
    case 'HARD':
      return (
        <Badge variant="outline" className="border-rose-500/40 text-rose-600 bg-rose-50/50">
          Hard
        </Badge>
      );
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/15">
          Completed
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/15">
          Expired
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/15">
          In Progress
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getScoreColor(percentage: number) {
  if (percentage >= 80) return 'text-emerald-600 font-semibold';
  if (percentage >= 60) return 'text-amber-600 font-medium';
  return 'text-rose-600 font-medium';
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

const ROWS_PER_PAGE = 10;

// ─── Component ──────────────────────────────────────────────────────────────

export function AnalyticsDashboard({
  quizStats,
  attempts,
  overallStats,
}: AnalyticsDashboardProps) {
  const [search, setSearch] = React.useState('');
  const [filterQuiz, setFilterQuiz] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [sortField, setSortField] = React.useState<SortField>('startedAt');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(1);

  // ── Filtering ──
  const filteredAttempts = React.useMemo(() => {
    let result = attempts;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.studentName.toLowerCase().includes(q) ||
          a.studentEmail.toLowerCase().includes(q) ||
          a.quizTitle.toLowerCase().includes(q)
      );
    }

    if (filterQuiz !== 'all') {
      result = result.filter((a) => a.quizTitle === filterQuiz);
    }

    if (filterStatus !== 'all') {
      result = result.filter((a) => a.status === filterStatus);
    }

    return result;
  }, [attempts, search, filterQuiz, filterStatus]);

  // ── Sorting ──
  const sortedAttempts = React.useMemo(() => {
    const sorted = [...filteredAttempts];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'studentName':
          cmp = a.studentName.localeCompare(b.studentName);
          break;
        case 'quizTitle':
          cmp = a.quizTitle.localeCompare(b.quizTitle);
          break;
        case 'score':
          cmp = a.score - b.score;
          break;
        case 'percentage':
          cmp = a.percentage - b.percentage;
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'startedAt':
          cmp =
            new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredAttempts, sortField, sortDir]);

  // ── Pagination ──
  const totalPages = Math.ceil(sortedAttempts.length / ROWS_PER_PAGE);
  const paginatedAttempts = sortedAttempts.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, filterQuiz, filterStatus, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const uniqueQuizTitles = React.useMemo(
    () => [...new Set(attempts.map((a) => a.quizTitle))],
    [attempts]
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-3 py-0.5 text-xs font-medium text-muted-foreground">
          <SparklesIcon className="size-3 text-primary" />
          <span>Creator Analytics</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
          <ActivityIcon className="size-7 text-primary" />
          Quiz Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track performance and results across all quizzes you&apos;ve authored.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Quizzes"
          value={overallStats.totalQuizzes}
          icon={<BookOpenIcon className="text-primary" />}
          description="Quizzes you've created"
        />
        <StatCard
          title="Total Attempts"
          value={overallStats.totalAttempts}
          icon={<UsersIcon className="text-primary" />}
          description="Across all your quizzes"
        />
        <StatCard
          title="Completed"
          value={overallStats.totalCompletedAttempts}
          icon={<TrophyIcon className="text-primary" />}
          description="Finished attempts"
        />
        <StatCard
          title="Avg. Score"
          value={
            overallStats.overallAveragePercentage !== null
              ? `${overallStats.overallAveragePercentage}%`
              : '—'
          }
          icon={<BarChart3Icon className="text-primary" />}
          description={
            overallStats.overallAveragePercentage !== null
              ? 'Average across completed'
              : 'No completed attempts yet'
          }
        />
      </div>

      {/* Per-Quiz Summary Cards */}
      {quizStats.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold tracking-tight mb-4">
            Quiz Performance Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizStats.map((qs) => (
              <Card key={qs.quizId} className="transition-all hover:shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold line-clamp-1">
                      {qs.quizTitle}
                    </CardTitle>
                    {getDifficultyBadge(qs.difficulty)}
                  </div>
                  <CardDescription className="text-xs">
                    {qs.category} · {qs.totalQuestions} questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        Attempts
                      </span>
                      <span className="font-semibold tabular-nums">
                        {qs.totalAttempts}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        Completed
                      </span>
                      <span className="font-semibold tabular-nums">
                        {qs.completedAttempts}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        Avg. Score
                      </span>
                      <span className="font-semibold tabular-nums">
                        {qs.averagePercentage !== null
                          ? `${qs.averagePercentage}%`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        Range
                      </span>
                      <span className="font-semibold tabular-nums text-xs">
                        {qs.completedAttempts > 0
                          ? `${qs.lowestScore}–${qs.highestScore} / ${qs.totalQuestions}`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            All Attempt Results
          </CardTitle>
          <CardDescription className="text-xs">
            Detailed records of every attempt made on your quizzes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="analytics-search"
                placeholder="Search by name, email, or quiz..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterQuiz} onValueChange={(v) => setFilterQuiz(v ?? 'all')}>
              <SelectTrigger id="analytics-quiz-filter" className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Quizzes" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Quizzes</SelectItem>
                  {uniqueQuizTitles.map((title) => (
                    <SelectItem key={title} value={title}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
              <SelectTrigger id="analytics-status-filter" className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {sortedAttempts.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton
                        label="Student"
                        field="studentName"
                        currentField={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>
                      <SortButton
                        label="Quiz"
                        field="quizTitle"
                        currentField={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>
                      <SortButton
                        label="Status"
                        field="status"
                        currentField={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton
                        label="Score"
                        field="score"
                        currentField={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton
                        label="Percentage"
                        field="percentage"
                        currentField={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead>
                      <SortButton
                        label="Date"
                        field="startedAt"
                        currentField={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-sm">
                            {attempt.studentName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {attempt.studentEmail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {attempt.quizTitle}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {attempt.quizCategory}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(attempt.status)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={getScoreColor(attempt.percentage)}>
                          {attempt.score}/{attempt.totalQuestions}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={getScoreColor(attempt.percentage)}>
                          {attempt.percentage}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon className="size-3" />
                          {formatDuration(attempt.durationSeconds)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(attempt.startedAt).toLocaleDateString(
                          undefined,
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t mt-2">
                <p className="text-xs text-muted-foreground">
                  Showing{' '}
                  <span className="font-medium text-foreground">
                    {(page - 1) * ROWS_PER_PAGE + 1}
                  </span>
                  –
                  <span className="font-medium text-foreground">
                    {Math.min(page * ROWS_PER_PAGE, sortedAttempts.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-foreground">
                    {sortedAttempts.length}
                  </span>{' '}
                  results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="gap-1"
                  >
                    <ChevronLeftIcon className="size-4" />
                    <span className="sr-only sm:not-sr-only">Previous</span>
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums px-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="gap-1"
                  >
                    <span className="sr-only sm:not-sr-only">Next</span>
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <BarChart3Icon className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No attempt results found</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                {attempts.length === 0
                  ? 'No one has attempted your quizzes yet. Share your published quizzes to start collecting results.'
                  : 'No results match your current filters. Try adjusting your search or filters.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          {title}
          <span className="[&_svg]:size-5">{icon}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
          {value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function SortButton({
  label,
  field,
  currentField,
  currentDir,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDir: 'asc' | 'desc';
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
      onClick={() => onSort(field)}
    >
      <span>{label}</span>
      <ArrowUpDownIcon
        className={`size-3.5 ${
          isActive ? 'text-primary' : 'text-muted-foreground/50'
        } ${isActive && currentDir === 'asc' ? 'rotate-180' : ''} transition-transform`}
      />
    </button>
  );
}
