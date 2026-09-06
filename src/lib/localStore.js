const STORAGE_KEY = 'deen-tracker-local-v1';
const EVENT = 'deen-tracker-local-change';

export const LOCAL_DOC_PATHS = [
  'quran/progress',
  'sajda/count',
  'sajda/tilawatButtons',
  'charity/amount',
];

export const LOCAL_COLLECTION_PATHS = [
  'nafl',
  'qaza/Fajr/entries',
  'qaza/Zuhr/entries',
  'qaza/Asr/entries',
  'qaza/Maghrib/entries',
  'qaza/Isha/entries',
];

function emptyStore() {
  return { documents: {}, collections: {} };
}

export function readLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return {
      documents: parsed?.documents && typeof parsed.documents === 'object' ? parsed.documents : {},
      collections: parsed?.collections && typeof parsed.collections === 'object' ? parsed.collections : {},
    };
  } catch {
    return emptyStore();
  }
}

function writeLocalStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function notify(key) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }));
}

export function getLocalDocument(path) {
  return readLocalStore().documents[path] ?? null;
}

export function setLocalDocument(path, data, merge = true) {
  const store = readLocalStore();
  const prev = store.documents[path] && typeof store.documents[path] === 'object'
    ? store.documents[path]
    : {};
  store.documents[path] = merge ? { ...prev, ...data } : data;
  writeLocalStore(store);
  notify(`doc:${path}`);
}

export function getLocalCollection(path) {
  const items = readLocalStore().collections[path];
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function addLocalCollectionItem(path, item) {
  const store = readLocalStore();
  const items = Array.isArray(store.collections[path]) ? store.collections[path] : [];
  const id = crypto.randomUUID();
  items.push({ ...item, id, createdAt: item.createdAt ?? Date.now() });
  store.collections[path] = items;
  writeLocalStore(store);
  notify(`col:${path}`);
  return id;
}

export function removeLocalCollectionItem(path, id) {
  const store = readLocalStore();
  const items = Array.isArray(store.collections[path]) ? store.collections[path] : [];
  store.collections[path] = items.filter((item) => item.id !== id);
  writeLocalStore(store);
  notify(`col:${path}`);
}

export function subscribeLocal(key, callback) {
  const handler = (event) => {
    if (!event.detail?.key || event.detail.key === key) callback();
  };
  window.addEventListener(EVENT, handler);
  const storageHandler = (event) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

function isMeaningfulDoc(data) {
  if (!data || typeof data !== 'object') return false;
  const keys = Object.keys(data);
  if (!keys.length) return false;
  if (typeof data.count === 'number' && data.count > 0) return true;
  if (typeof data.juz === 'number' && data.juz > 0) return true;
  if (typeof data.fraction === 'number' && data.fraction > 0) return true;
  if (typeof data.amount === 'number' && data.amount !== 0) return true;
  if (Array.isArray(data.pressed) && data.pressed.length > 0) return true;
  return keys.some((key) => data[key] !== null && data[key] !== undefined && data[key] !== 0 && data[key] !== '');
}

export function hasMeaningfulLocalData() {
  const store = readLocalStore();
  for (const path of LOCAL_DOC_PATHS) {
    if (isMeaningfulDoc(store.documents[path])) return true;
  }
  for (const path of LOCAL_COLLECTION_PATHS) {
    if (Array.isArray(store.collections[path]) && store.collections[path].length > 0) return true;
  }
  return false;
}

export function exportLocalData() {
  const store = readLocalStore();
  const data = {
    quran: store.documents['quran/progress'] || null,
    sajda: store.documents['sajda/count'] || null,
    sajdaButtons: store.documents['sajda/tilawatButtons'] || null,
    charity: store.documents['charity/amount'] || null,
    nafl: getLocalCollection('nafl'),
    qaza: {},
  };
  for (const prayer of ['Fajr', 'Zuhr', 'Asr', 'Maghrib', 'Isha']) {
    data.qaza[prayer] = getLocalCollection(`qaza/${prayer}/entries`);
  }
  return data;
}

export { isMeaningfulDoc };
