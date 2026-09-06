import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  hasMeaningfulLocalData,
  isMeaningfulDoc,
  LOCAL_COLLECTION_PATHS,
  LOCAL_DOC_PATHS,
  readLocalStore,
} from '@/lib/localStore';

/**
 * Copies guest localStorage data into the signed-in user's Firestore docs
 * only where those cloud docs/collections are empty. Existing cloud data
 * is never overwritten.
 */
export async function mergeLocalIntoCloud(uid) {
  if (!db || !uid || !hasMeaningfulLocalData()) return;

  const store = readLocalStore();

  for (const relativePath of LOCAL_DOC_PATHS) {
    const localData = store.documents[relativePath];
    if (!isMeaningfulDoc(localData)) continue;

    const ref = doc(db, `users/${uid}/${relativePath}`);
    const snap = await getDoc(ref);
    if (snap.exists()) continue;

    await setDoc(ref, localData, { merge: true });
  }

  for (const relativePath of LOCAL_COLLECTION_PATHS) {
    const localItems = Array.isArray(store.collections[relativePath])
      ? store.collections[relativePath]
      : [];
    if (!localItems.length) continue;

    const colRef = collection(db, `users/${uid}/${relativePath}`);
    const cloudSnap = await getDocs(colRef);
    if (!cloudSnap.empty) continue;

    for (const item of localItems) {
      const { id: _id, ...rest } = item;
      await addDoc(colRef, rest);
    }
  }
}
