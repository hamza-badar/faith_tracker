import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDocument } from '@/hooks/useFirestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookOpen, ChevronRight } from 'lucide-react';

function todayDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isFriday() {
  return new Date().getDay() === 5;
}

export default function FridayKahfBanner() {
  const { data, loading, save } = useDocument('quran/progress');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingHide, setPendingHide] = useState(false);

  const dateKey = todayDateKey();
  const answeredToday = data?.kahfFridayDate === dateKey;
  const showBanner = isFriday() && !loading && !answeredToday && !pendingHide;

  const closeAfterSave = () => {
    setPendingHide(true);
    setDialogOpen(false);
  };

  const handleNo = () => {
    save({ kahfFridayDate: dateKey, kahfRecited: false })
      .then(() => closeAfterSave())
      .catch(() => toast.error('Failed to save'));
  };

  const handleYes = () => {
    save({ updatedAt: Date.now(), kahfFridayDate: dateKey, kahfRecited: true })
      .then(() => {
        toast.success('Surah Al-Kahf recorded');
        closeAfterSave();
      })
      .catch(() => toast.error('Failed to update'));
  };

  if (!showBanner) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="w-full border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-left transition-colors hover:bg-amber-500/15 sm:px-6"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Friday reminder</p>
            <p className="truncate text-xs text-muted-foreground">
              Have you recited Surah Al-Kahf today?
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Surah Al-Kahf</DialogTitle>
            <DialogDescription>
              It is from the Sunnah to recite Surah Al-Kahf on Friday. Did you recite it today?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleNo}>
              No
            </Button>
            <Button type="button" onClick={handleYes}>
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
