import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onDelete: () => Promise<void> | void;
  entityLabel?: string;
  disabled?: boolean;
}

export function BulkActionBar({ count, onClear, onDelete, entityLabel = 'item', disabled }: BulkActionBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (count === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-lg rounded-full px-4 py-2 flex items-center gap-3 animate-slide-up">
        <span className="text-sm font-medium text-foreground">
          {count} {entityLabel}{count === 1 ? '' : 's'} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
          onClick={() => setConfirmOpen(true)}
          disabled={disabled}
        >
          <Trash2 className="w-4 h-4 mr-1.5" /> Delete
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClear}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {count} {entityLabel}{count === 1 ? '' : 's'}?</AlertDialogTitle>
            <AlertDialogDescription>
              These will be moved to the trash and can be recovered later. They will be hidden from all views immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { await onDelete(); setConfirmOpen(false); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
