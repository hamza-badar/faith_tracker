import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  getDocFromServer,
  getDocsFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useDocument(path, options = {}) {
  const { serverOnly = false } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path || !db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, path);

    if (serverOnly) {
      getDocFromServer(ref)
        .then((snap) => {
          setData(snap.exists() ? snap.data() : null);
          setLoading(false);
        })
        .catch((err) => {
          console.error(`Firestore server doc error [${path}]:`, err);
          setLoading(false);
        });
    }

    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        if (serverOnly && snap.metadata.fromCache) return;
        setData(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore doc error [${path}]:`, err);
        setLoading(false);
      }
    );
    return unsub;
  }, [path, serverOnly]);

  const save = useCallback(
    async (newData) => {
      if (!path || !db) return;
      await setDoc(doc(db, path), newData, { merge: true });
    },
    [path],
  );

  return { data, loading, save };
}

export function useCollection(path, orderField = 'createdAt', options = {}) {
  const { serverOnly = false } = options;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path || !db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = collection(db, path);

    let q;
    try {
      q = query(ref, orderBy(orderField, 'desc'));
    } catch {
      q = ref;
    }

    if (serverOnly) {
      getDocsFromServer(q)
        .then((snap) => {
          setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        })
        .catch((err) => {
          console.error(`Firestore server collection error [${path}]:`, err);
          setLoading(false);
        });
    }

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        if (serverOnly && snap.metadata.fromCache) return;
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore collection error [${path}]:`, err);
        setLoading(false);
      }
    );
    return unsub;
  }, [path, orderField, serverOnly]);

  const add = useCallback(
    async (item) => {
      if (!path || !db) return;
      await addDoc(collection(db, path), { ...item, createdAt: Date.now() });
    },
    [path],
  );

  const remove = useCallback(
    async (id) => {
      if (!path || !db) return;
      await deleteDoc(doc(db, path, id));
    },
    [path],
  );

  return { items, loading, add, remove };
}
