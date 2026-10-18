'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DeleteQuizDialog } from './delete-quiz-dialog';
import {
  createQuizAction,
  updateQuizAction,
} from '@/app/actions/quiz-actions';
import { toast } from '@/components/ui/toast';
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  HelpCircleIcon,
  InfoIcon,
  Loader2Icon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadCloudIcon,
} from 'lucide-react';

const COMMON_CATEGORIES = [
  'Programming',
  'Web Development',
  'Computer Networks',
  'Database Systems',
  'Operating Systems',
  'Cloud Computing',
  'Cyber Security',
  'Software Engineering',
  'Artificial Intelligence',
  'Custom',
];

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export interface QuizInitialData {
  id?: string;
  title: string;
  description?: string | null;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimitMinutes: number;
  isPublished: boolean;
  questions: Array<{
    id?: string;
    text: string;
    explanation?: string | null;
    position: number;
    options: Array<{
      id?: string;
      text: string;
      isCorrect: boolean;
      position: number;
    }>;
  }>;
}

interface FormOption {
  clientId: string;
  id?: string;
  text: string;
  isCorrect: boolean;
  position: number;
}

interface FormQuestion {
  clientId: string;
  id?: string;
  text: string;
  explanation: string;
  position: number;
  options: FormOption[];
}

export interface QuizFormProps {
  initialData?: QuizInitialData;
  isEditing?: boolean;
}

function createEmptyQuestion(pos: number): FormQuestion {
  return {
    clientId: crypto.randomUUID(),
    text: '',
    explanation: '',
    position: pos,
    options: [
      { clientId: crypto.randomUUID(), text: '', isCorrect: true, position: 1 },
      { clientId: crypto.randomUUID(), text: '', isCorrect: false, position: 2 },
      { clientId: crypto.randomUUID(), text: '', isCorrect: false, position: 3 },
      { clientId: crypto.randomUUID(), text: '', isCorrect: false, position: 4 },
    ],
  };
}

export function QuizForm({ initialData, isEditing = false }: QuizFormProps) {
  const router = useRouter();

  // Initialize metadata
  const [title, setTitle] = React.useState(initialData?.title || '');
  const [description, setDescription] = React.useState(
    initialData?.description || ''
  );
  const initialCategoryIsCommon = initialData
    ? COMMON_CATEGORIES.includes(initialData.category)
    : true;
  const [selectedCategoryPreset, setSelectedCategoryPreset] = React.useState(
    initialData
      ? initialCategoryIsCommon
        ? initialData.category
        : 'Custom'
      : 'Programming'
  );
  const [customCategory, setCustomCategory] = React.useState(
    initialData && !initialCategoryIsCommon ? initialData.category : ''
  );
  const [difficulty, setDifficulty] = React.useState<'EASY' | 'MEDIUM' | 'HARD'>(
    initialData?.difficulty || 'MEDIUM'
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState(
    initialData?.timeLimitMinutes || 15
  );

  // Initialize questions
  const [questions, setQuestions] = React.useState<FormQuestion[]>(() => {
    if (initialData?.questions && initialData.questions.length > 0) {
      return initialData.questions.map((q, qIdx) => ({
        clientId: crypto.randomUUID(),
        id: q.id,
        text: q.text,
        explanation: q.explanation || '',
        position: qIdx + 1,
        options: q.options.map((opt, optIdx) => ({
          clientId: crypto.randomUUID(),
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          position: optIdx + 1,
        })),
      }));
    }
    return [createEmptyQuestion(1)];
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitIntent, setSubmitIntent] = React.useState<
    'draft' | 'publish' | null
  >(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});
  const [isDirty, setIsDirty] = React.useState(false);

  // Mark form as dirty when inputs change
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  const currentCategory =
    selectedCategoryPreset === 'Custom'
      ? customCategory.trim()
      : selectedCategoryPreset;

  // Question manipulation
  const handleAddQuestion = () => {
    markDirty();
    setQuestions((prev) => [...prev, createEmptyQuestion(prev.length + 1)]);
  };

  const handleRemoveQuestion = (indexToRemove: number) => {
    if (questions.length <= 1) {
      toast.add({
        title: 'Cannot remove question',
        description: 'A quiz must have at least one question slot.',
        type: 'warning',
      });
      return;
    }

    markDirty();
    setQuestions((prev) =>
      prev
        .filter((_, idx) => idx !== indexToRemove)
        .map((q, idx) => ({ ...q, position: idx + 1 }))
    );
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    markDirty();
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, text } : q))
    );
  };

  const handleQuestionExplanationChange = (
    qIndex: number,
    explanation: string
  ) => {
    markDirty();
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, explanation } : q))
    );
  };

  const handleOptionTextChange = (
    qIndex: number,
    optIndex: number,
    text: string
  ) => {
    markDirty();
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        return {
          ...q,
          options: q.options.map((opt, j) =>
            j === optIndex ? { ...opt, text } : opt
          ),
        };
      })
    );
  };

  const handleSetCorrectOption = (qIndex: number, correctOptIndex: number) => {
    markDirty();
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        return {
          ...q,
          options: q.options.map((opt, j) => ({
            ...opt,
            isCorrect: j === correctOptIndex,
          })),
        };
      })
    );
  };

  // Client validation check
  const validateForm = (isPublishing: boolean): boolean => {
    setFormError(null);
    setFieldErrors({});

    const errors: Record<string, string[]> = {};

    if (!title.trim() || title.trim().length < 3) {
      errors.title = ['Quiz title must be at least 3 characters.'];
    } else if (title.trim().length > 120) {
      errors.title = ['Quiz title cannot exceed 120 characters.'];
    }

    if (!currentCategory || currentCategory.length < 2) {
      errors.category = ['Please specify a category (at least 2 characters).'];
    }

    if (!timeLimitMinutes || timeLimitMinutes < 1 || timeLimitMinutes > 180) {
      errors.timeLimitMinutes = [
        'Time limit must be between 1 and 180 minutes.',
      ];
    }

    if (isPublishing) {
      if (questions.length === 0) {
        errors.questions = [
          'A published quiz must contain at least one question.',
        ];
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qNum = i + 1;

        if (!q.text.trim()) {
          errors[`question_${i}_text`] = [
            `Question ${qNum} text cannot be empty.`,
          ];
        }

        if (q.options.length !== 4) {
          errors[`question_${i}_options`] = [
            `Question ${qNum} must have exactly 4 answer options.`,
          ];
        }

        const emptyOpts = q.options.filter((opt) => !opt.text.trim());
        if (emptyOpts.length > 0) {
          errors[`question_${i}_options_text`] = [
            `Question ${qNum} has ${emptyOpts.length} empty option(s). All 4 options are required.`,
          ];
        }

        const correctOpts = q.options.filter((opt) => opt.isCorrect);
        if (correctOpts.length !== 1) {
          errors[`question_${i}_correct`] = [
            `Question ${qNum} must have exactly one correct answer selected.`,
          ];
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0]?.[0];
      setFormError(firstError || 'Please correct the highlighted errors.');
      return false;
    }

    return true;
  };

  // Form submission handler
  const handleSubmit = async (publishTarget: boolean) => {
    const isValid = validateForm(publishTarget);
    if (!isValid) {
      toast.add({
        title: publishTarget ? 'Cannot publish quiz' : 'Invalid draft data',
        description:
          formError || 'Please review the form errors before saving.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitIntent(publishTarget ? 'publish' : 'draft');
    setFormError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: currentCategory,
      difficulty,
      timeLimitMinutes: Number(timeLimitMinutes),
      isPublished: publishTarget,
      questions: questions.map((q, idx) => ({
        id: q.id,
        text: q.text.trim(),
        explanation: q.explanation.trim() || undefined,
        position: idx + 1,
        options: q.options.map((opt, optIdx) => ({
          id: opt.id,
          text: opt.text.trim(),
          isCorrect: opt.isCorrect,
          position: optIdx + 1,
        })),
      })),
    };

    try {
      let res;
      if (isEditing && initialData?.id) {
        res = await updateQuizAction(initialData.id, payload);
      } else {
        res = await createQuizAction(payload);
      }

      if (res.error) {
        setFormError(res.error);
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        toast.add({
          title: 'Failed to save quiz',
          description: res.error,
          type: 'error',
        });
      } else {
        setIsDirty(false);
        toast.add({
          title: publishTarget ? 'Quiz published!' : 'Draft saved!',
          description: publishTarget
            ? 'Your quiz is now live and discoverable in the Quiz Catalog.'
            : 'Your draft has been saved. You can return and continue anytime.',
          type: 'success',
        });

        router.push('/dashboard/my-quizzes');
        router.refresh();
      }
    } catch {
      setFormError('An unexpected network or server error occurred.');
      toast.add({
        title: 'Submission error',
        description: 'Unable to communicate with the server. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
      setSubmitIntent(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/my-quizzes"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>Back to My Quizzes</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {isEditing ? 'Edit Quiz' : 'Create New Quiz'}
            </h1>
            {initialData && (
              <Badge
                variant={initialData.isPublished ? 'default' : 'secondary'}
                className="text-xs capitalize font-medium"
              >
                {initialData.isPublished ? 'Published' : 'Draft'}
              </Badge>
            )}
            {isDirty && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-medium">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditing
              ? 'Update quiz metadata, questions, and answers. Save as draft or publish for students.'
              : 'Compose questions, set difficulty, and configure time limits for your examination.'}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isEditing && initialData?.id && (
            <DeleteQuizDialog
              quizId={initialData.id}
              quizTitle={title || 'Untitled Quiz'}
              redirectToMyQuizzes
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 gap-1.5"
                >
                  <Trash2Icon className="size-3.5" />
                  <span>Delete</span>
                </Button>
              }
            />
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting && submitIntent === 'draft' ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <FileTextIcon className="size-3.5 text-muted-foreground" />
            )}
            <span>Save Draft</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting && submitIntent === 'publish' ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <UploadCloudIcon className="size-3.5" />
            )}
            <span>Publish Quiz</span>
          </Button>
        </div>
      </div>

      {/* Global Form Error Alert */}
      {formError && (
        <Alert variant="destructive">
          <TriangleAlertIcon className="size-4" />
          <AlertTitle>Validation Issue</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* Section 1: Quiz Metadata Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            <CardTitle>Quiz Details & Metadata</CardTitle>
          </div>
          <CardDescription>
            Basic information displayed on the quiz catalog card and student
            assessment overview.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiz-title">
                Quiz Title <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {title.length}/120
              </span>
            </div>
            <Input
              id="quiz-title"
              placeholder="e.g. Distributed Systems & RPC Protocol Fundamentals"
              value={title}
              maxLength={120}
              onChange={(e) => {
                markDirty();
                setTitle(e.target.value);
              }}
              aria-invalid={Boolean(fieldErrors.title)}
            />
            {fieldErrors.title && (
              <p className="text-xs text-destructive font-medium">
                {fieldErrors.title[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiz-desc">
                Description{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {description.length}/1000
              </span>
            </div>
            <Textarea
              id="quiz-desc"
              rows={3}
              placeholder="Provide context on topics covered, prerequisites, or learning outcomes..."
              value={description}
              maxLength={1000}
              onChange={(e) => {
                markDirty();
                setDescription(e.target.value);
              }}
            />
          </div>

          {/* Category, Difficulty & Time Limit Row */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="quiz-category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCategoryPreset}
                onValueChange={(val) => {
                  if (typeof val === 'string') {
                    markDirty();
                    setSelectedCategoryPreset(val);
                  }
                }}
              >
                <SelectTrigger id="quiz-category" className="w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {COMMON_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              {selectedCategoryPreset === 'Custom' && (
                <div className="pt-1">
                  <Input
                    placeholder="Enter custom category name..."
                    value={customCategory}
                    maxLength={50}
                    onChange={(e) => {
                      markDirty();
                      setCustomCategory(e.target.value);
                    }}
                    aria-invalid={Boolean(fieldErrors.category)}
                  />
                </div>
              )}
              {fieldErrors.category && (
                <p className="text-xs text-destructive font-medium">
                  {fieldErrors.category[0]}
                </p>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="quiz-difficulty">
                Difficulty Level <span className="text-destructive">*</span>
              </Label>
              <Select
                value={difficulty}
                onValueChange={(val) => {
                  if (typeof val === 'string') {
                    markDirty();
                    setDifficulty(val as 'EASY' | 'MEDIUM' | 'HARD');
                  }
                }}
              >
                <SelectTrigger id="quiz-difficulty" className="w-full">
                  <SelectValue placeholder="Select Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Time Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quiz-timelimit">
                  Time Limit (Minutes) <span className="text-destructive">*</span>
                </Label>
                <ClockIcon className="size-3.5 text-muted-foreground" />
              </div>
              <Input
                id="quiz-timelimit"
                type="number"
                min={1}
                max={180}
                value={timeLimitMinutes}
                onChange={(e) => {
                  markDirty();
                  setTimeLimitMinutes(parseInt(e.target.value, 10) || 1);
                }}
                aria-invalid={Boolean(fieldErrors.timeLimitMinutes)}
              />
              {fieldErrors.timeLimitMinutes && (
                <p className="text-xs text-destructive font-medium">
                  {fieldErrors.timeLimitMinutes[0]}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Questions Editor */}
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Questions & Options ({questions.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Each question must have exactly 4 answer options and exactly 1
              designated correct answer.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddQuestion}
            className="gap-1.5 self-start sm:self-auto"
          >
            <PlusIcon className="size-3.5" />
            <span>Add Question</span>
          </Button>
        </div>

        {fieldErrors.questions && (
          <p className="text-xs text-destructive font-medium">
            {fieldErrors.questions[0]}
          </p>
        )}

        {/* Dynamic Questions List */}
        <div className="space-y-6">
          {questions.map((question, qIdx) => {
            const hasTextError = fieldErrors[`question_${qIdx}_text`];
            const hasOptionsError =
              fieldErrors[`question_${qIdx}_options`] ||
              fieldErrors[`question_${qIdx}_options_text`];
            const hasCorrectError = fieldErrors[`question_${qIdx}_correct`];

            return (
              <Card
                key={question.clientId}
                className="relative overflow-hidden border transition-shadow hover:shadow-xs"
              >
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-semibold px-2 py-0.5">
                        Question {qIdx + 1}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        Multiple Choice (Single Answer)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={questions.length <= 1}
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="h-8 px-2 text-muted-foreground hover:text-destructive"
                        title={
                          questions.length <= 1
                            ? 'A quiz must have at least one question'
                            : 'Remove question'
                        }
                      >
                        <Trash2Icon className="size-4" />
                        <span className="sr-only">Remove question</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 pt-4">
                  {/* Question Text */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`q-text-${question.clientId}`}>
                      Question Statement{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id={`q-text-${question.clientId}`}
                      placeholder={`e.g. Which of the following HTTP methods is idempotent?`}
                      rows={2}
                      value={question.text}
                      onChange={(e) =>
                        handleQuestionTextChange(qIdx, e.target.value)
                      }
                      aria-invalid={Boolean(hasTextError)}
                    />
                    {hasTextError && (
                      <p className="text-xs text-destructive font-medium">
                        {hasTextError[0]}
                      </p>
                    )}
                  </div>

                  {/* 4 Options Grid */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Answer Options (Select the correct option)
                      </Label>
                      {hasCorrectError && (
                        <span className="text-xs text-destructive font-medium">
                          {hasCorrectError[0]}
                        </span>
                      )}
                    </div>

                    <RadioGroup
                      value={
                        question.options.find((o) => o.isCorrect)?.clientId ||
                        ''
                      }
                      onValueChange={(val) => {
                        const optIndex = question.options.findIndex(
                          (o) => o.clientId === val
                        );
                        if (optIndex !== -1) {
                          handleSetCorrectOption(qIdx, optIndex);
                        }
                      }}
                      className="gap-3"
                    >
                      {question.options.map((opt, optIdx) => {
                        const letter = OPTION_LETTERS[optIdx];
                        const isCorrect = opt.isCorrect;

                        return (
                          <div
                            key={opt.clientId}
                            onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                            className={`group relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                              isCorrect
                                ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 dark:bg-primary/10'
                                : 'border-border/70 hover:border-border hover:bg-muted/40'
                            }`}
                          >
                            <div className="flex items-center">
                              <RadioGroupItem
                                value={opt.clientId}
                                id={`radio-${opt.clientId}`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            <span
                              className={`flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                                isCorrect
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                              }`}
                            >
                              {letter}
                            </span>

                            <div className="flex-1">
                              <Input
                                placeholder={`Enter Option ${letter} text...`}
                                value={opt.text}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  handleOptionTextChange(
                                    qIdx,
                                    optIdx,
                                    e.target.value
                                  )
                                }
                                className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-1"
                              />
                            </div>

                            {isCorrect && (
                              <Badge
                                variant="default"
                                className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-primary text-primary-foreground font-medium"
                              >
                                <CheckCircle2Icon className="size-3" />
                                <span>Correct</span>
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </RadioGroup>

                    {hasOptionsError && (
                      <p className="text-xs text-destructive font-medium pt-1">
                        {hasOptionsError[0]}
                      </p>
                    )}
                  </div>

                  {/* Optional Explanation */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Label
                        htmlFor={`q-expl-${question.clientId}`}
                        className="text-xs text-muted-foreground font-normal"
                      >
                        Answer Explanation / Viva Note (Optional)
                      </Label>
                      <HelpCircleIcon className="size-3 text-muted-foreground/60" />
                    </div>
                    <Input
                      id={`q-expl-${question.clientId}`}
                      placeholder="e.g. GET, HEAD, PUT, and DELETE are idempotent according to RFC 7231."
                      value={question.explanation}
                      onChange={(e) =>
                        handleQuestionExplanationChange(qIdx, e.target.value)
                      }
                      className="text-xs h-8"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add Question Card Footer Button */}
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddQuestion}
            className="w-full sm:w-auto gap-2 border-dashed"
          >
            <PlusIcon className="size-4" />
            <span>Add Another Question</span>
          </Button>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border bg-card/95 p-4 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <InfoIcon className="size-4 text-primary" />
          <span>
            {questions.length} question{questions.length === 1 ? '' : 's'} in
            this quiz. Drafts remain private; published quizzes appear in the
            catalog.
          </span>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting && submitIntent === 'draft' ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <FileTextIcon className="size-4 text-muted-foreground" />
            )}
            <span>Save Draft</span>
          </Button>

          <Button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting && submitIntent === 'publish' ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <UploadCloudIcon className="size-4" />
            )}
            <span>Publish Quiz</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
