// Best-effort copy of each request into Firestore ("requests" collection).
// WhatsApp is the delivery channel; this never blocks or fails the form.
export async function saveRequest(kind: 'booking' | 'collab', data: Record<string, string | number | boolean>) {
  try {
    const [{ initializeApp, getApps }, { getFirestore, collection, addDoc, serverTimestamp }, cfg] = await Promise.all([
      import('firebase/app'), import('firebase/firestore'), import('../../firebase-applet-config.json'),
    ]);
    const config = cfg.default;
    const app = getApps()[0] ?? initializeApp(config);
    await addDoc(collection(getFirestore(app, config.firestoreDatabaseId), 'requests'), { kind, ...data, createdAt: serverTimestamp() });
  } catch (err) {
    console.warn('Request not saved to Firestore (rules may not allow it yet):', err);
  }
}
