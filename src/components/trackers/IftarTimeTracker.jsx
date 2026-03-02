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

function formatLocationDetails(details) {
  if (!details) return '';
  const parts = [
    details.name,
    details.city,
    details.postcode,
    details.state,
    details.country,
  ].filter((x) => typeof x === 'string' && x.trim());
  return parts.join(', ');
}

async function fetchPrayerCalendar({ latitude, longitude, month, year, method = 1, school = 1, source = 'islamicapi' }) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    month: String(month),
    year: String(year),
    method: String(method),
    school: String(school),
    source: String(source),
  });

  let res;
  try {
    res = await fetch(`/api/prayer-calendar?${params.toString()}`);
  } catch (err) {
    throw new Error(`Network error contacting prayer API: ${err?.message || 'Failed to fetch'}`);
  }
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json().catch(() => null);
      const msg = `${json?.message || json?.error || `API error (${res.status})`} Please try a different source.`;
      throw new Error(msg);
    }
    const txt = await res.text().catch(() => '');
    throw new Error(`${txt || `API error (${res.status})`} Please try a different source.`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const txt = await res.text().catch(() => '');
    if (txt.includes('function pad2(') || txt.includes('export default async function handler')) {
      throw new Error('API route is not executing (receiving source file). Use deployed app or run `vercel dev` instead of `npm run dev`.');
    }
    throw new Error(`Prayer API returned non-JSON response${txt ? `: ${txt.slice(0, 120)}` : ''}`);
  }

  const json = await res.json().catch(() => null);
  if (!json || json.code !== 200 || !Array.isArray(json.data)) {
    throw new Error('Unexpected API response');
  }
  return {
    data: json.data,
    provider: json.provider || 'unknown',
  };
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

async function fetchLocationDetails({ latitude, longitude }) {
  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
    });
    const res = await fetch(`/api/reverse-geocode?${params.toString()}`);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export default function IftarTimeTracker() {
  const [status, setStatus] = useState('idle'); // idle | locating | fetching | ready | error
  const [error, setError] = useState('');
  const [coords, setCoords] = useState(null);
  const [meta, setMeta] = useState(null);
  const [days, setDays] = useState([]);
  const [isRamadanToday, setIsRamadanToday] = useState(false);
  const [locationDetails, setLocationDetails] = useState(null);
  const [locationLookupAttempted, setLocationLookupAttempted] = useState(false);
  const [timingSource, setTimingSource] = useState(() => {
    try {
      const saved = localStorage.getItem('iftar_timing_source');
      return saved === 'aladhan' ? 'aladhan' : 'islamicapi';
    } catch {
      return 'islamicapi';
    }
  });
  const locationText = useMemo(() => formatLocationDetails(locationDetails), [locationDetails]);

  const currentMonthYear = useMemo(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }, []);

  const load = useCallback(async () => {
    setError('');
    setDays([]);
    setMeta(null);
    setIsRamadanToday(false);
    setLocationDetails(null);
    setLocationLookupAttempted(false);

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
    const [{ data }, geoDetails] = await Promise.all([
      fetchPrayerCalendar({
        latitude,
        longitude,
        month: currentMonthYear.month,
        year: currentMonthYear.year,
        method: 1,
        school: 1,
        source: timingSource,
      }),
      fetchLocationDetails({ latitude, longitude }),
    ]);
    setLocationLookupAttempted(true);

    const nowMs = Date.now();
    const todayIso = getLocalISODate();
    const mapped = data.map((d) => {
      const y = d?.date?.gregorian?.year;
      const mo = d?.date?.gregorian?.month?.number;
      const dayNum = d?.date?.gregorian?.day;
      const isoDate = `${y}-${pad2(mo)}-${pad2(dayNum)}`;

      const imsak = parseHHMM(
        d?.timings?.Imsak ||
        d?.timings?.Suhoor ||
        d?.timings?.Sahur ||
        d?.timings?.Fajr
      );
      const sunset = parseHHMM(
        d?.timings?.Sunset ||
        d?.timings?.Iftar ||
        d?.timings?.Maghrib
      );

      const iftarMs = buildLocalDateTimeMs(isoDate, sunset);
      const isPast = iftarMs ? nowMs > iftarMs : false;

      return {
        isoDate,
        dateLabel: formatDateLabel(isoDate),
        sahur: formatHHMM(imsak),
        iftar: formatHHMM(sunset),
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
    setLocationDetails(geoDetails);
    setStatus('ready');
  }, [currentMonthYear.month, currentMonthYear.year, timingSource]);

  useEffect(() => {
    try {
      localStorage.setItem('iftar_timing_source', timingSource);
    } catch {
      // Ignore storage errors.
    }
  }, [timingSource]);

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
                Lat {coords.latitude}, Lon {coords.longitude}
              </p>
            )}
            {locationText && (
              <p className="text-xs text-muted-foreground mt-1">
                {locationText}
              </p>
            )}
            {!locationText && locationLookupAttempted && (
              <p className="text-xs text-muted-foreground mt-1">
                Location details unavailable
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source:</span>
              <button
                type="button"
                onClick={() => setTimingSource('islamicapi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  timingSource === 'islamicapi'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border'
                }`}
              >
                IslamicAPI
              </button>
              <button
                type="button"
                onClick={() => setTimingSource('aladhan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  timingSource === 'aladhan'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border'
                }`}
              >
                AlAdhan
              </button>
            </div>
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
          {error?.toLowerCase().includes('location') ? (
            <p className="text-xs text-muted-foreground mt-1">
              Tip: enable location permission for this site, then press Refresh.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Tip: refresh once; if it continues, clear site data and reload to refresh cached assets.
            </p>
          )}
        </div>
      ) : null}

      {status === 'ready' && days.length > 0 ? (
        <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 bg-secondary/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Monthly Timings
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/50">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Sahur</th>
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
                      <td className={cell}>{row.sahur}</td>
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
