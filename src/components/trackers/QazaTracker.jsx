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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';

const PRAYERS = [
  { id: 'Fajr', label: 'Fajr' },
  { id: 'Zuhr', label: 'Zuhr' },
  { id: 'Asr', label: 'Asr' },
  { id: 'Maghrib', label: 'Maghrib' },
  { id: 'Isha', label: 'Isha' },
];

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

function useAllQazaData(uid) {
  const fajr = useCollection(`users/${uid}/qaza/Fajr/entries`);
  const zuhr = useCollection(`users/${uid}/qaza/Zuhr/entries`);
  const asr = useCollection(`users/${uid}/qaza/Asr/entries`);
  const maghrib = useCollection(`users/${uid}/qaza/Maghrib/entries`);
  const isha = useCollection(`users/${uid}/qaza/Isha/entries`);

  const prayerData = { Fajr: fajr, Zuhr: zuhr, Asr: asr, Maghrib: maghrib, Isha: isha };
  const loading = Object.values(prayerData).some((d) => d.loading);
  const totalCount = Object.values(prayerData).reduce((sum, d) => sum + d.items.length, 0);

  const allEntries = [];
  for (const p of PRAYERS) {
    const data = prayerData[p.id];
    data.items.forEach((item) => {
      allEntries.push({ ...item, prayer: p.id, removeFn: () => data.remove(item.id) });
    });
  }
  allEntries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return { prayerData, loading, totalCount, allEntries };
}

export default function QazaTracker() {
  const { user } = useAuthContext();
  const { prayerData, loading, totalCount, allEntries } = useAllQazaData(user.uid);
  const [isOpen, setIsOpen] = useState(false);
  const [prayer, setPrayer] = useState('Fajr');
  const [date, setDate] = useState(today());
  const [reason, setReason] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prayer || !date || !reason.trim()) return;
    const trimmedReason = reason.trim();
    setIsOpen(false);
    setReason('');
    prayerData[prayer].add({ date, reason: trimmedReason, prayer })
      .then(() => toast.success(`${prayer} Qaza recorded`))
      .catch(() => toast.error('Failed to save'));
  };

  const handleDelete = (entry) => {
    entry.removeFn().then(() => toast.success('Entry removed')).catch(() => toast.error('Failed to delete'));
  };

  return (
    <div className="pt-4 pb-2 space-y-6">
      <div className="bg-secondary/30 p-6 rounded-3xl border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">Total: {loading ? '...' : totalCount}</h3>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl shadow-sm bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-6 border-border/50">
              <DialogHeader className="mb-4">
                <DialogTitle className="font-display text-2xl">Record Qaza</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="qaza-prayer" className="text-muted-foreground">Prayer</Label>
                  <Select value={prayer} onValueChange={setPrayer} required>
                    <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 border-border/50 px-4 font-medium">
                      <SelectValue placeholder="Select prayer" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-lg">
                      {PRAYERS.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="rounded-lg font-medium">{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qaza-date" className="text-muted-foreground">Missed Date (Approx)</Label>
                  <Input
                    id="qaza-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-14 rounded-2xl bg-secondary/30 border-border/50 px-4 font-medium"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qaza-reason" className="text-muted-foreground">Notes / Reason</Label>
                  <Input
                    id="qaza-reason"
                    placeholder="e.g. Travel, Overslept..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-14 rounded-2xl bg-secondary/30 border-border/50 px-4 font-medium"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl text-lg font-medium shadow-md mt-2"
                >
                  Save Entry
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {PRAYERS.map((p) => (
            <div key={p.id} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/50 shadow-sm">
              <span className="text-xs text-muted-foreground font-medium mb-1">{p.label}</span>
              <span className="font-display font-bold text-xl text-foreground">{prayerData[p.id].loading ? '–' : prayerData[p.id].items.length}</span>
            </div>
          ))}
        </div>
      </div>

      {allEntries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">Recent Records</h4>
          {allEntries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground font-display font-bold text-sm uppercase">
                  {entry.prayer.substring(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-foreground capitalize flex items-center gap-2">
                    {entry.prayer}
                    <span className="text-xs font-normal text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">{entry.reason}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center mt-0.5">
                    <Calendar className="w-3 h-3 mr-1 inline" />
                    {formatDate(entry.date)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(entry)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
