import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/context/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sun, Plus, Trash2, Calendar } from 'lucide-react';

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function NaflTracker() {
  const { user } = useAuthContext();
  const { items, loading, add, remove } = useCollection(`users/${user.uid}/nafl`, 'createdAt', { serverOnly: true });
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [reason, setReason] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !reason.trim()) return;
    const trimmedReason = reason.trim();
    setIsOpen(false);
    setReason('');
    setDate(today());
    add({ date, reason: trimmedReason })
      .then(() => toast.success('Nafl recorded'))
      .catch(() => toast.error('Failed to save'));
  };

  const handleDelete = (id) => {
    remove(id).then(() => toast.success('Entry removed')).catch(() => toast.error('Failed to delete'));
  };

  return (
    <div className="pt-4 pb-2 space-y-4">
      <div className="flex items-center justify-between bg-secondary/30 p-6 rounded-3xl border border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-3xl font-display font-semibold text-foreground">
              {loading ? '...' : items.length}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">Total Entries</p>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-6 border-border/50">
            <DialogHeader className="mb-4">
              <DialogTitle className="font-display text-2xl">Record Nafl</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nafl-date" className="text-muted-foreground">Date</Label>
                <Input
                  id="nafl-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-14 rounded-2xl bg-secondary/30 border-border/50 px-4 font-medium"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nafl-reason" className="text-muted-foreground">Intention / Notes</Label>
                <Input
                  id="nafl-reason"
                  placeholder="e.g. Tahajjud, Gratitude, Repentance..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-14 rounded-2xl bg-secondary/30 border-border/50 px-4 font-medium"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-14 rounded-2xl text-lg font-medium shadow-md"
              >
                Save Entry
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3 mt-6">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">History</h4>
          {items.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{entry.reason}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(entry.date)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(entry.id)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center px-4">
          <p className="text-muted-foreground text-sm font-medium">No entries recorded yet.</p>
        </div>
      )}
    </div>
  );
}
