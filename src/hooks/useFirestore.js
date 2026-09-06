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
import { useAuthContext } from '@/context/AuthContext';
import {
  addLocalCollectionItem,
  getLocalCollection,
  getLocalDocument,
  removeLocalCollectionItem,
  setLocalDocument,
  subscribeLocal,
} from '@/lib/localStore';

export function useDocument(relativePath) {
  const { user } = useAuthContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!relativePath) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (uid && db) {
      const unsub = onSnapshot(
        doc(db, `users/${uid}/${relativePath}`),
        (snap) => {
          setData(snap.exists() ? snap.data() : null);
          setLoading(false);
        },
        (err) => {
          console.error(`Firestore doc error [users/${uid}/${relativePath}]:`, err);
          setLoading(false);
        }
      );
      return unsub;
    }

    const apply = () => {
      setData(getLocalDocument(relativePath));
      setLoading(false);
    };
    apply();
    return subscribeLocal(`doc:${relativePath}`, apply);
  }, [uid, relativePath]);

  const save = useCallback(
    async (newData) => {
      if (!relativePath) return;
      if (uid && db) {
        await setDoc(doc(db, `users/${uid}/${relativePath}`), newData, { merge: true });
        return;
      }
      setLocalDocument(relativePath, newData, true);
    },
    [uid, relativePath],
  );

  return { data, loading, save };
}

export function useCollection(relativePath, orderField = 'createdAt') {
  const { user } = useAuthContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!relativePath) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (uid && db) {
      const ref = collection(db, `users/${uid}/${relativePath}`);
      let q;
      try {
        q = query(ref, orderBy(orderField, 'desc'));
      } catch {
        q = ref;
      }

      const unsub = onSnapshot(
        q,
        (snap) => {
          setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        (err) => {
          console.error(`Firestore collection error [users/${uid}/${relativePath}]:`, err);
          setLoading(false);
        }
      );
      return unsub;
    }

    const apply = () => {
      setItems(getLocalCollection(relativePath));
      setLoading(false);
    };
    apply();
    return subscribeLocal(`col:${relativePath}`, apply);
  }, [uid, relativePath, orderField]);

  const add = useCallback(
    async (item) => {
      if (!relativePath) return;
      if (uid && db) {
        await addDoc(collection(db, `users/${uid}/${relativePath}`), { ...item, createdAt: Date.now() });
        return;
      }
      addLocalCollectionItem(relativePath, item);
    },
    [uid, relativePath],
  );

  const remove = useCallback(
    async (id) => {
      if (!relativePath) return;
      if (uid && db) {
        await deleteDoc(doc(db, `users/${uid}/${relativePath}`, id));
        return;
      }
      removeLocalCollectionItem(relativePath, id);
    },
    [uid, relativePath],
  );

  return { items, loading, add, remove };
}
