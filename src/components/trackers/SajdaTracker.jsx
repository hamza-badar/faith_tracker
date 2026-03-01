import { useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/context/AuthContext';
import { useDocument } from '@/hooks/useFirestore';
import { useLongPress } from '@/hooks/useLongPress';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import { User, Minus, Plus } from 'lucide-react';

export default function SajdaTracker() {
  const { user } = useAuthContext();
  const { data, loading, save } = useDocument(`users/${user.uid}/sajda/count`);

  const count = data?.count ?? 0;
  const countRef = useRef(count);
  countRef.current = count;

  const handleIncrement = useCallback(() => {
    const next = countRef.current + 1;
    countRef.current = next;
    save({ count: next }).catch(() => toast.error('Failed to update'));
  }, [save]);

  const handleDecrement = useCallback(() => {
    if (countRef.current <= 0) return;
    const next = countRef.current - 1;
    countRef.current = next;
    save({ count: next }).catch(() => toast.error('Failed to update'));
  }, [save]);

  const incrementPress = useLongPress(handleIncrement);
  const decrementPress = useLongPress(handleDecrement);

  if (loading) {
    return <div className="space-y-4 py-4"><Skeleton className="h-16 w-full rounded-2xl" /></div>;
  }

  return (
    <div className="pt-4 pb-2">
      <div className="flex items-center justify-between bg-secondary/30 p-6 rounded-3xl border border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-3xl font-display font-semibold text-foreground">
              {count}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">Sajda Tilawat</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-2xl border-border/50 shadow-sm select-none touch-none"
            disabled={count === 0}
            {...decrementPress}
          >
            <Minus className="w-5 h-5" />
          </Button>
          <Button
            className="w-12 h-12 rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground select-none touch-none"
            size="icon"
            {...incrementPress}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
