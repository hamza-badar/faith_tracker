import { useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/context/AuthContext';
import { useDocument } from '@/hooks/useFirestore';
import { useLongPress } from '@/hooks/useLongPress';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import { formatUncheckedSajdaReminder, getUncheckedSajdaJuz } from '@/lib/sajda';
import { BookOpen, Minus, Plus } from 'lucide-react';

const MAX_QUARTERS = 120;

/** Human-readable labels for Juz fraction (1/4, 1/2, 3/4) */
const JUZ_FRACTION = {
  0: '',
  1: 'quarter',
  2: 'half',
  3: 'three-quarters',
};

function quartersToJuz(q) {
  return { juz: Math.floor(q / 4), fraction: q % 4 };
}

function formatQuarters(q) {
  if (q <= 0) return "Let's begin";
  if (q >= MAX_QUARTERS) return 'Completed';
  const juz = Math.floor(q / 4);
  const frac = q % 4;
  const fractionLabel = JUZ_FRACTION[frac];
  if (!fractionLabel) return `${juz} Juz`;
  // When in a fraction, we're partway through the next Juz (show 1-based)
  const displayJuz = juz + 1;
  return `${displayJuz} Juz + ${fractionLabel}`;
}

function formatLastUpdated(value) {
  if (!value) return null;

  const date = typeof value?.toDate === 'function'
    ? value.toDate()
    : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function QuranTracker() {
  const { user } = useAuthContext();
  const { data, loading, save } = useDocument(`users/${user.uid}/quran/progress`, { serverOnly: true });
  const buttonDoc = useDocument(`users/${user.uid}/sajda/tilawatButtons`, { serverOnly: true });

  const storedJuz = data?.juz ?? 0;
  const storedFraction = data?.fraction ?? 0;
  const storedQuarters = storedJuz * 4 + storedFraction;
  const currentQuarters = Math.max(0, Math.min(storedQuarters, MAX_QUARTERS));
  const lastUpdated = formatLastUpdated(data?.updatedAt);

  const quartersRef = useRef(currentQuarters);
  quartersRef.current = currentQuarters;

  const handleIncrement = useCallback(() => {
    let next = Math.min(quartersRef.current + 1, MAX_QUARTERS);
    quartersRef.current = next;
    const { juz, fraction } = quartersToJuz(next);
    const missingSajda = getUncheckedSajdaJuz(buttonDoc.data?.pressed, juz);
    const reminderMessage = formatUncheckedSajdaReminder(missingSajda);

    if (reminderMessage) {
      toast(reminderMessage, { id: 'sajda-tilawat-reminder' });
    }

    save({ juz, fraction, updatedAt: Date.now() }).catch(() => toast.error('Failed to update'));
  }, [buttonDoc.data?.pressed, save]);

  const handleDecrement = useCallback(() => {
    let next = Math.max(quartersRef.current - 1, 0);
    quartersRef.current = next;
    const { juz, fraction } = quartersToJuz(next);
    save({ juz, fraction, updatedAt: Date.now() }).catch(() => toast.error('Failed to update'));
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
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold text-foreground">
              {formatQuarters(currentQuarters)}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">Quran Recitation</p>
            {lastUpdated && (
              <p className="mt-0.5 text-[11px] font-medium leading-none text-accent-foreground/70">
                Last updated {lastUpdated}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-2xl border-border/50 shadow-sm select-none touch-none"
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

      <div className="mt-6 px-2">
        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${(currentQuarters / MAX_QUARTERS) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1 font-medium">
          <span>Start</span>
          <span>Juz 30</span>
        </div>
      </div>
    </div>
  );
}
