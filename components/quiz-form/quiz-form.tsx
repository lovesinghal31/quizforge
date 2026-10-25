'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteQuizDialog } from './delete-quiz-dialog';
import { toast } from '@/components/ui/toast';
import { ArrowLeftIcon, PlusIcon, Trash2Icon, Loader2Icon, SparklesIcon } from 'lucide-react';

const CATEGORIES = [
  'Programming',
  'Web Development',
  'Computer Networks',
  'Database Systems',
  'Operating Systems',
  'Cloud Computing',
  'General Computer Science',
];

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export interface QuizInitialData {
  id?: string;
  title: string;
  description?: string | null;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimitMinutes: number;
  isPublished?: boolean;
  questions: Array<{
    id?: string;
    text: string;
    options: Array<{
      id?: string;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
}

interface QuestionState {
  text: string;
  options: string[];
  correctIndex: number;
}

interface QuizFormProps {
  initialData?: QuizInitialData;
  isEditing?: boolean;
}

export function QuizForm({ initialData, isEditing = false }: QuizFormProps) {
  const router = useRouter();

  // Basic quiz fields
  const [title, setTitle] = React.useState(initialData?.title || '');
  const [description, setDescription] = React.useState(initialData?.description || '');
  const [category, setCategory] = React.useState(initialData?.category || 'Programming');
  const [difficulty, setDifficulty] = React.useState<'EASY' | 'MEDIUM' | 'HARD'>(
    initialData?.difficulty || 'MEDIUM'
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState(
    initialData?.timeLimitMinutes || 10
  );

  // Questions state
  const [questions, setQuestions] = React.useState<QuestionState[]>(() => {
    if (initialData?.questions && initialData.questions.length > 0) {
      return initialData.questions.map((q) => {
        const correctIdx = q.options.findIndex((opt) => opt.isCorrect);
        return {
          text: q.text,
          options: q.options.map((opt) => opt.text),
          correctIndex: correctIdx >= 0 ? correctIdx : 0,
        };
      });
    }
    return [{ text: '', options: ['', '', '', ''], correctIndex: 0 }];
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Add question
  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { text: '', options: ['', '', '', ''], correctIndex: 0 },
    ]);
  };

  // Remove question
  const removeQuestion = (qIndex: number) => {
    if (questions.length <= 1) {
      toast.add({
        title: 'Cannot remove question',
        description: 'A quiz must have at least one question.',
        type: 'warning',
      });
      return;
    }
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  // Update question text
  const updateQuestionText = (qIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, text } : q))
    );
  };

  // Update option text
  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const newOptions = [...q.options];
        newOptions[optIndex] = text;
        return { ...q, options: newOptions };
      })
    );
  };

  // Set correct answer
  const setCorrectOption = (qIndex: number, correctIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, correctIndex } : q))
    );
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side quick checks
    if (!title.trim()) {
      toast.add({ title: 'Title required', description: 'Please enter a quiz title.', type: 'error' });
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.add({
          title: 'Empty question',
          description: `Question ${i + 1} has no text.`,
          type: 'error',
        });
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          toast.add({
            title: 'Empty option',
            description: `Question ${i + 1}, Option ${OPTION_LETTERS[j]} cannot be empty.`,
            type: 'error',
          });
          return;
        }
      }
    }

    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      timeLimitMinutes: Number(timeLimitMinutes),
      questions: questions.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((optText, optIdx) => ({
          text: optText.trim(),
          isCorrect: optIdx === q.correctIndex,
        })),
      })),
    };

    try {
      const endpoint = isEditing && initialData?.id ? `/api/quizzes/${initialData.id}` : '/api/quizzes';
      const method = isEditing && initialData?.id ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.add({ title: 'Failed to save quiz', description: data.error || 'Server error', type: 'error' });
        setIsSubmitting(false);
      } else {
        toast.add({
          title: isEditing ? 'Quiz updated!' : 'Quiz created!',
          description: 'Your quiz is now live and ready to take.',
          type: 'success',
        });
        router.push('/dashboard/my-quizzes');
        router.refresh();
      }
    } catch {
      toast.add({ title: 'Network error', description: 'Could not connect to server.', type: 'error' });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-4xl space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/my-quizzes"
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>Back to My Quizzes</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isEditing ? 'Edit Quiz' : 'Create New Quiz'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter quiz details, questions, 4 options per question, and select the correct answer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEditing && initialData?.id && (
            <DeleteQuizDialog
              quizId={initialData.id}
              quizTitle={title || 'this quiz'}
              redirectToMyQuizzes
              trigger={
                <Button type="button" variant="destructive" size="sm" className="gap-1.5">
                  <Trash2Icon className="size-4" />
                  <span>Delete</span>
                </Button>
              }
            />
          )}

          <Button type="submit" disabled={isSubmitting} className="gap-2 font-semibold">
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? 'Save Changes' : 'Create & Publish Quiz'}</span>
            )}
          </Button>
        </div>
      </div>

      {/* Quiz Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quiz Details</CardTitle>
          <CardDescription>Basic information about your assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Quiz Title *</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. JavaScript ES6 Essentials"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-desc">Description (Optional)</Label>
            <Textarea
              id="quiz-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of what this quiz covers..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => v && setDifficulty(v as 'EASY' | 'MEDIUM' | 'HARD')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-time">Time Limit (Minutes)</Label>
              <Input
                id="quiz-time"
                type="number"
                min={1}
                max={180}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            Questions ({questions.length})
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="gap-1.5">
            <PlusIcon className="size-4" />
            <span>Add Question</span>
          </Button>
        </div>

        {questions.map((question, qIdx) => (
          <Card key={qIdx} className="border shadow-xs">
            <CardHeader className="bg-muted/30 pb-3 flex flex-row items-center justify-between border-b">
              <span className="font-semibold text-sm">Question {qIdx + 1}</span>
              {questions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(qIdx)}
                  className="text-muted-foreground hover:text-destructive h-8 px-2"
                >
                  <Trash2Icon className="size-4" />
                  <span className="sr-only">Remove Question {qIdx + 1}</span>
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor={`q-${qIdx}-text`}>Question Text *</Label>
                <Input
                  id={`q-${qIdx}-text`}
                  value={question.text}
                  onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                  placeholder="e.g. Which keyword declares a block-scoped variable in JavaScript?"
                  required
                />
              </div>

              {/* 4 Options with Radio button to mark the correct one */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Options (Select radio button for the correct answer)
                </Label>

                <RadioGroup
                  value={String(question.correctIndex)}
                  onValueChange={(val) => setCorrectOption(qIdx, Number(val))}
                  className="gap-2.5"
                >
                  {question.options.map((optText, optIdx) => {
                    const letter = OPTION_LETTERS[optIdx];
                    const isCorrect = question.correctIndex === optIdx;

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                          isCorrect
                            ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                            : 'border-border'
                        }`}
                      >
                        <RadioGroupItem
                          value={String(optIdx)}
                          id={`q-${qIdx}-opt-${optIdx}`}
                        />
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
                          {letter}
                        </span>
                        <Input
                          value={optText}
                          onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                          placeholder={`Option ${letter} text`}
                          className="h-9 flex-1"
                          required
                        />
                        {isCorrect && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 pr-1">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add question footer button */}
        <Button
          type="button"
          variant="outline"
          onClick={addQuestion}
          className="w-full gap-2 py-6 border-dashed"
        >
          <PlusIcon className="size-4" />
          <span>Add Another Question</span>
        </Button>
      </div>

      {/* Bottom Submit Row */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Link href="/dashboard/my-quizzes">
          <Button type="button" variant="ghost">Cancel</Button>
        </Link>
        <Button type="submit" disabled={isSubmitting} size="lg" className="gap-2 font-semibold px-8">
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{isEditing ? 'Save Changes' : 'Create & Publish Quiz'}</span>
          )}
        </Button>
      </div>
    </form>
  );
}
