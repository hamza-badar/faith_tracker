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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useDocument(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path || !db) {
      setLoading(false);
      return;
    }
    const ref = doc(db, path);
    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        setData(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore doc error [${path}]:`, err);
        setLoading(false);
      }
    );
    return unsub;
  }, [path]);

  const save = useCallback(
    async (newData) => {
      if (!path || !db) return;
      await setDoc(doc(db, path), newData, { merge: true });
    },
    [path],
  );

  return { data, loading, save };
}

export function useCollection(path, orderField = 'createdAt') {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path || !db) {
      setLoading(false);
      return;
    }
    const ref = collection(db, path);

    let q;
    try {
      q = query(ref, orderBy(orderField, 'desc'));
    } catch {
      q = ref;
    }

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore collection error [${path}]:`, err);
        setLoading(false);
      }
    );
    return unsub;
  }, [path, orderField]);

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
