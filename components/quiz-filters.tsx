'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchIcon, XIcon, RotateCcwIcon, SlidersHorizontalIcon } from 'lucide-react';

interface QuizFiltersProps {
  categories: string[];
  initialSearch?: string;
  initialCategory?: string;
  initialDifficulty?: string;
}

export function QuizFilters({
  categories,
  initialSearch = '',
  initialCategory = 'all',
  initialDifficulty = 'all',
}: QuizFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [prevSearch, setPrevSearch] = React.useState(initialSearch);
  const [searchQuery, setSearchQuery] = React.useState(initialSearch);

  if (initialSearch !== prevSearch) {
    setPrevSearch(initialSearch);
    setSearchQuery(initialSearch);
  }

  const updateFilters = React.useCallback(
    (newParams: { q?: string; category?: string; difficulty?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update search query
      if (newParams.q !== undefined) {
        if (newParams.q.trim()) {
          params.set('q', newParams.q.trim());
        } else {
          params.delete('q');
        }
      }

      // Update category
      if (newParams.category !== undefined) {
        if (newParams.category && newParams.category !== 'all') {
          params.set('category', newParams.category);
        } else {
          params.delete('category');
        }
      }

      // Update difficulty
      if (newParams.difficulty !== undefined) {
        if (newParams.difficulty && newParams.difficulty !== 'all') {
          params.set('difficulty', newParams.difficulty);
        } else {
          params.delete('difficulty');
        }
      }

      // Always reset pagination to page 1 on filter changes
      params.delete('page');

      const queryString = params.toString();
      router.push(`/quizzes${queryString ? `?${queryString}` : ''}`);
    },
    [router, searchParams]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchQuery });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    updateFilters({ q: '' });
  };

  const handleResetAll = () => {
    setSearchQuery('');
    router.push('/quizzes');
  };

  const hasActiveFilters = Boolean(
    initialSearch ||
      (initialCategory && initialCategory !== 'all') ||
      (initialDifficulty && initialDifficulty !== 'all')
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card/60 p-4 shadow-xs">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1"
        >
          <div className="relative flex items-center">
            <SearchIcon className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quizzes by title or topic…"
              className="pl-9 pr-9 h-10 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Category selector */}
        <div className="w-full md:w-56">
          <Select
            value={initialCategory || 'all'}
            onValueChange={(val) => {
              if (typeof val === 'string') {
                updateFilters({ category: val });
              }
            }}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty selector */}
        <div className="w-full md:w-44">
          <Select
            value={initialDifficulty || 'all'}
            onValueChange={(val) => {
              if (typeof val === 'string') {
                updateFilters({ difficulty: val });
              }
            }}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Search button for explicit submit */}
        <Button
          type="button"
          onClick={() => updateFilters({ q: searchQuery })}
          className="h-10 px-4"
        >
          <SlidersHorizontalIcon data-icon="inline-start" />
          <span>Apply</span>
        </Button>

        {/* Reset button if any filter is active */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleResetAll}
            className="h-10 text-muted-foreground hover:text-foreground"
          >
            <RotateCcwIcon data-icon="inline-start" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
