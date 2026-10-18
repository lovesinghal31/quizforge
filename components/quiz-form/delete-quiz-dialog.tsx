'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteQuizAction } from '@/app/actions/quiz-actions';
import { toast } from '@/components/ui/toast';
import { Loader2Icon, Trash2Icon } from 'lucide-react';

interface DeleteQuizDialogProps {
  quizId: string;
  quizTitle: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  redirectToMyQuizzes?: boolean;
}

export function DeleteQuizDialog({
  quizId,
  quizTitle,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
  redirectToMyQuizzes = false,
}: DeleteQuizDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);

    try {
      const res = await deleteQuizAction(quizId);
      if (res.error) {
        toast.add({
          title: 'Error deleting quiz',
          description: res.error,
          type: 'error',
        });
      } else {
        toast.add({
          title: 'Quiz deleted',
          description: `"${quizTitle}" was permanently deleted.`,
          type: 'success',
        });
        setOpen(false);
        if (onSuccess) {
          onSuccess();
        }
        if (redirectToMyQuizzes) {
          router.push('/dashboard/my-quizzes');
        } else {
          router.refresh();
        }
      }
    } catch {
      toast.add({
        title: 'Error deleting quiz',
        description: 'An unexpected error occurred. Please try again.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger render={trigger as React.ReactElement} />}
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
            <Trash2Icon className="size-5" />
          </div>
          <AlertDialogTitle className="text-left text-lg font-semibold">
            Delete Quiz
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to delete <span className="font-semibold text-foreground">&ldquo;{quizTitle}&rdquo;</span>?
            This will permanently remove the quiz, all its questions, answer options, and related student attempts. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2Icon className="size-4" />
                <span>Delete Quiz</span>
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
