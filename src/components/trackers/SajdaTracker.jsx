import { useEffect, useMemo, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/context/AuthContext';
import { useDocument } from '@/hooks/useFirestore';
import { useLongPress } from '@/hooks/useLongPress';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import { SAJDA_BUTTONS } from '@/lib/sajda';
import { User, Minus, Plus } from 'lucide-react';
import { arrayRemove, arrayUnion, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SajdaTracker() {
  const { user } = useAuthContext();
  const { data, loading, save } = useDocument(`users/${user.uid}/sajda/count`, { serverOnly: true });
  const buttonDocPath = `users/${user.uid}/sajda/tilawatButtons`;
  const buttonDoc = useDocument(buttonDocPath, { serverOnly: true });

  const count = data?.count ?? 0;
  const countRef = useRef(count);
  countRef.current = count;

  const pressedSet = useMemo(() => {
    const arr = buttonDoc.data?.pressed;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((n) => Number.isInteger(n)));
  }, [buttonDoc.data]);

  const resetTimeoutRef = useRef(null);

  const persistPress = useCallback(async (idx) => {
    if (!db || !user?.uid) return;
    const ref = doc(db, buttonDocPath);
    try {
      await updateDoc(ref, { pressed: arrayUnion(idx), updatedAt: Date.now() });
    } catch (err) {
      if (err?.code === 'not-found') {
        await setDoc(ref, { pressed: [idx], updatedAt: Date.now() }, { merge: true });
        return;
      }
      throw err;
    }
  }, [buttonDocPath, user?.uid]);

  const persistUnpress = useCallback(async (idx) => {
    if (!db || !user?.uid) return;
    const ref = doc(db, buttonDocPath);
    try {
      await updateDoc(ref, { pressed: arrayRemove(idx), updatedAt: Date.now() });
    } catch (err) {
      if (err?.code === 'not-found') {
        await setDoc(ref, { pressed: [], updatedAt: Date.now() }, { merge: true });
        return;
      }
      throw err;
    }
  }, [buttonDocPath, user?.uid]);

  const persistReset = useCallback(async () => {
    if (!db || !user?.uid) return;
    await setDoc(doc(db, buttonDocPath), { pressed: [], updatedAt: Date.now() }, { merge: true });
  }, [buttonDocPath, user?.uid]);

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

  useEffect(() => {
    if (resetTimeoutRef.current) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    if (pressedSet.size === SAJDA_BUTTONS.length) {
      resetTimeoutRef.current = window.setTimeout(() => {
        persistReset().catch(() => toast.error('Failed to reset'));
        resetTimeoutRef.current = null;
      }, 350);
    }
    return () => {
      if (resetTimeoutRef.current) {
        window.clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };
  }, [persistReset, pressedSet]);

  const handleSajdaButtonPress = useCallback((idx) => {
    if (pressedSet.has(idx)) {
      persistUnpress(idx).catch(() => toast.error('Failed to update'));
      return;
    }
    persistPress(idx).catch(() => toast.error('Failed to update'));
  }, [persistPress, persistUnpress, pressedSet]);

  if (loading || buttonDoc.loading) {
    return <div className="space-y-4 py-4"><Skeleton className="h-16 w-full rounded-2xl" /></div>;
  }

  return (
    <div className="pt-4 pb-2">
      <div className="bg-secondary/30 p-6 rounded-3xl border border-border/50">
        <div className="flex items-center justify-between">
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

        <div className="mt-4 flex flex-wrap gap-2">
          {SAJDA_BUTTONS.map((n, idx) => {
            const isPressed = pressedSet.has(idx);
            return (
              <Button
                key={`${n}-${idx}`}
                type="button"
                variant="outline"
                onClick={() => handleSajdaButtonPress(idx)}
                className={[
                  'h-8 w-8 rounded-full p-0 text-xs font-semibold shadow-sm',
                  isPressed
                    ? 'bg-foreground text-background border-foreground hover:bg-foreground/90 hover:text-background'
                    : 'border-border/50 bg-background/40 hover:bg-background/70',
                ].join(' ')}
              >
                {n}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
