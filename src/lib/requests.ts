import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Best-effort copy of each request into Firestore ("requests" collection).
// WhatsApp is the delivery channel; this never blocks or fails the form.
export async function saveRequest(kind: 'booking' | 'collab', data: Record<string, string | number | boolean>) {
  try {
    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    await addDoc(collection(db, 'requests'), { kind, ...data, createdAt: serverTimestamp() });
  } catch (err) {
    console.warn('Request not saved to Firestore (rules may not allow it yet):', err);
  }
}
