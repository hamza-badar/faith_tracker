import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { BookOpen, Heart, Clock, Sun, User, Utensils } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const FEATURES = [
  { icon: BookOpen, label: 'Quran Progress', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { icon: Clock, label: 'Qaza Prayers', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { icon: Sun, label: 'Nafl Tracker', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  { icon: User, label: 'Sajda Count', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  { icon: Heart, label: 'Charity', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  { icon: Utensils, label: 'Iftar Time', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
];

export default function SignInDialog({ trigger }) {
  const { loginWithGoogle, firebaseConfigured } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!firebaseConfigured) return null;

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      setOpen(false);
    } catch {
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-6 border-border/50">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-display text-2xl">Sync across devices</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-5">
          Sign in only if you want your progress on other devices. This browser already saves your data locally.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {FEATURES.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${color} border border-border/30`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          ))}
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card px-6 py-4 text-sm font-semibold text-foreground shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
        {error && (
          <p className="mt-4 text-sm text-destructive font-medium">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SignInButton() {
  return (
    <SignInDialog
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full h-10 px-3 text-muted-foreground hover:text-foreground"
          title="Sign in to sync"
        >
          Sign in
        </Button>
      }
    />
  );
}
