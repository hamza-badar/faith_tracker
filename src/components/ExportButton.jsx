import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

async function fetchAllData(uid) {
  const basePath = `users/${uid}`;
  const data = {};

  const naflSnap = await getDocs(collection(db, `${basePath}/nafl`));
  data.nafl = naflSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const quranSnap = await getDocs(collection(db, `${basePath}/quran`));
  quranSnap.docs.forEach((d) => { data.quran = d.data(); });

  const sajdaSnap = await getDocs(collection(db, `${basePath}/sajda`));
  sajdaSnap.docs.forEach((d) => { data.sajda = d.data(); });

  const charitySnap = await getDocs(collection(db, `${basePath}/charity`));
  charitySnap.docs.forEach((d) => { data.charity = d.data(); });

  const prayers = ['Fajr', 'Zuhr', 'Asr', 'Maghrib', 'Isha'];
  data.qaza = {};
  for (const prayer of prayers) {
    const snap = await getDocs(collection(db, `${basePath}/qaza/${prayer}/entries`));
    data.qaza[prayer] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return data;
}

export default function ExportButton() {
  const { user } = useAuthContext();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await fetchAllData(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deen-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleExport}
      disabled={exporting}
      className="rounded-full w-10 h-10 text-muted-foreground hover:text-foreground"
      title="Export data"
    >
      <Download className="h-5 w-5" />
    </Button>
  );
}
