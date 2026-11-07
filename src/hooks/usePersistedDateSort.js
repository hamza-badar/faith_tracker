import { useCallback, useState } from 'react';

export const QAZA_DATE_SORT_STORAGE_KEY = 'faith-tracker-qaza-date-sort';
export const NAFL_DATE_SORT_STORAGE_KEY = 'faith-tracker-nafl-date-sort';

function readDateSortDesc(storageKey, defaultDesc = true) {
  if (typeof window === 'undefined') return defaultDesc;
  const stored = localStorage.getItem(storageKey);
  if (stored === 'asc') return false;
  if (stored === 'desc') return true;
  return defaultDesc;
}

export function usePersistedDateSortDesc(storageKey, defaultDesc = true) {
  const [dateSortDesc, setDateSortDesc] = useState(() => readDateSortDesc(storageKey, defaultDesc));

  const toggleDateSort = useCallback(() => {
    setDateSortDesc((desc) => {
      const next = !desc;
      try {
        localStorage.setItem(storageKey, next ? 'desc' : 'asc');
      } catch {
        /* ignore quota / private mode */
      }
      return next;
    });
  }, [storageKey]);

  return [dateSortDesc, toggleDateSort];
}

export function sortEntriesByDate(entries, dateSortDesc) {
  return [...entries].sort((a, b) => {
    const byDate = (a.date || '').localeCompare(b.date || '');
    return dateSortDesc ? -byDate : byDate;
  });
}
