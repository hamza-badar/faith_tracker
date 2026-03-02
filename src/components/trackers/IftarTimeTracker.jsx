import { useCallback, useEffect, useMemo, useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw } from 'lucide-react';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseHHMM(raw) {
  if (!raw) return null;
  const match = String(raw).match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return { h, m };
}

function formatHHMM(t) {
  if (!t) return '—';
  const hour24 = t.h % 24;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${pad2(t.m)} ${period}`;
}

function subtractMinutes(t, minutes) {
  if (!t) return null;
  let total = (t.h * 60 + t.m) - minutes;
  total = ((total % 1440) + 1440) % 1440;
  return { h: Math.floor(total / 60), m: total % 60 };
}

function formatDateLabel(iso) {
  try {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function buildLocalDateTimeMs(isoDate, time) {
  if (!isoDate || !time) return null;
  const [y, mo, d] = isoDate.split('-').map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(y, mo - 1, d, time.h, time.m, 0, 0).getTime();
}

function getLocalISODate() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

async function fetchAladhanCalendar({ latitude, longitude, month, year, method = 2 }) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    month: String(month),
    year: String(year),
    method: String(method),
  });

  const candidates = [
    `/api/prayer-calendar?${params.toString()}`,
    `https://api.aladhan.com/v1/calendar?${params.toString()}`,
  ];

  let lastError = null;
  for (const endpoint of candidates) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`API error (${res.status})`);
      }
      const json = await res.json();
      if (!json || json.code !== 200 || !Array.isArray(json.data)) {
        throw new Error('Unexpected API response');
      }
      return json.data;
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(lastError?.message || 'Failed to fetch prayer timings.');
}

async function fetchRamadanStatus({ date, latitude, longitude }) {
  if (!date) return null;
  const params = new URLSearchParams({
    date,
    latitude: String(latitude),
    longitude: String(longitude),
  });

  try {
    const res = await fetch(`/api/ramadan-check?${params.toString()}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (typeof json?.isRamadan === 'boolean') {
      return { isRamadan: json.isRamadan, source: 'munafio' };
    }
  } catch {
    // Fallback handled by caller.
  }

  return null;
}

export default function IftarTimeTracker() {
  const [status, setStatus] = useState('idle'); // idle | locating | fetching | ready | error
  const [error, setError] = useState('');
  const [coords, setCoords] = useState(null);
  const [meta, setMeta] = useState(null);
  const [days, setDays] = useState([]);
  const [isRamadanToday, setIsRamadanToday] = useState(false);

  const currentMonthYear = useMemo(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }, []);

  const load = useCallback(async () => {
    setError('');
    setDays([]);
    setMeta(null);
    setIsRamadanToday(false);

    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setStatus('locating');
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000 * 60 * 30,
      });
    }).catch((err) => {
      const message =
        err?.code === 1 ? 'Location permission denied.' :
        err?.code === 2 ? 'Location unavailable.' :
        err?.code === 3 ? 'Location request timed out.' :
        'Failed to get location.';
      throw new Error(message);
    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    setCoords({ latitude, longitude });

    setStatus('fetching');
    const data = await fetchAladhanCalendar({
      latitude,
      longitude,
      month: currentMonthYear.month,
      year: currentMonthYear.year,
      method: 2,
    });

    const nowMs = Date.now();
    const todayIso = getLocalISODate();
    const mapped = data.map((d) => {
      const y = d?.date?.gregorian?.year;
      const mo = d?.date?.gregorian?.month?.number;
      const dayNum = d?.date?.gregorian?.day;
      const isoDate = `${y}-${pad2(mo)}-${pad2(dayNum)}`;

      const fajr = parseHHMM(d?.timings?.Fajr);
      const maghrib = parseHHMM(d?.timings?.Maghrib);
      const suhoor = subtractMinutes(fajr, 5);

      const iftarMs = buildLocalDateTimeMs(isoDate, maghrib);
      const isPast = iftarMs ? nowMs > iftarMs : false;

      return {
        isoDate,
        dateLabel: formatDateLabel(isoDate),
        suhoor: formatHHMM(suhoor),
        iftar: formatHHMM(maghrib),
        hijriMonthNumber: Number(d?.date?.hijri?.month?.number || 0),
        isPast,
      };
    });

    const todayEntry = mapped.find((d) => d.isoDate === todayIso) || null;
    const fallbackIsRamadan = todayEntry?.hijriMonthNumber === 9;
    const ramadanStatus = await fetchRamadanStatus({
      date: todayIso,
      latitude,
      longitude,
    });
    setIsRamadanToday(ramadanStatus?.isRamadan ?? fallbackIsRamadan);

    const timezone = data?.[0]?.meta?.timezone;
    setMeta({ timezone: timezone || null });
    setDays(mapped);
    setStatus('ready');
  }, [currentMonthYear.month, currentMonthYear.year]);

  useEffect(() => {
    load().catch((e) => {
      setStatus('error');
      setError(e?.message || 'Something went wrong.');
    });
  }, [load]);

  return (
    <div className="pt-4 pb-2 space-y-4">
      <div className="flex items-start justify-between gap-4 bg-secondary/30 p-6 rounded-3xl border border-border/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-xl font-display font-semibold ${isRamadanToday ? 'ramadan-glow text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>
              Iftar Time
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              {currentMonthYear.month}/{currentMonthYear.year}
              {meta?.timezone ? ` • ${meta.timezone}` : ''}
            </p>
            {isRamadanToday ? (
              <p className="text-xs mt-1 font-semibold text-emerald-700 dark:text-emerald-300">
                Ramadan is active for today
              </p>
            ) : null}
            {coords && (
              <p className="text-xs text-muted-foreground mt-1">
                Lat {coords.latitude.toFixed(4)}, Lon {coords.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-border/50 shadow-sm"
          onClick={() => load().catch((e) => { setStatus('error'); setError(e?.message || 'Something went wrong.'); })}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {status === 'locating' || status === 'fetching' ? (
        <div className="py-8">
          <Spinner className="mb-3" />
          <p className="text-center text-sm text-muted-foreground font-medium">
            {status === 'locating' ? 'Getting your location…' : 'Fetching this month’s timings…'}
          </p>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">{error || 'Failed to load.'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tip: enable location permission for this site, then press Refresh.
          </p>
        </div>
      ) : null}

      {status === 'ready' && days.length > 0 ? (
        <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 bg-secondary/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Suhoor time shown already includes 5-minute subtraction from Fajr • Iftar = Maghrib
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/50">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Suhoor</th>
                  <th className="px-5 py-3 font-semibold">Iftar</th>
                </tr>
              </thead>
              <tbody>
                {days.map((row) => {
                  const cell = row.isPast
                    ? 'px-5 py-3 text-muted-foreground line-through opacity-70'
                    : 'px-5 py-3 text-foreground';
                  return (
                    <tr key={row.isoDate} className="border-b last:border-b-0 border-border/40">
                      <td className={cell}>{row.dateLabel}</td>
                      <td className={cell}>{row.suhoor}</td>
                      <td className={cell}>{row.iftar}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
