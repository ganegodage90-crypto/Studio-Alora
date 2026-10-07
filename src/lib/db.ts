// Firebase is loaded only when a session is actually saved, so it does not slow down page load.
export async function saveSession(payload: Record<string, unknown>) {
  const [{ initializeApp, getApps }, { getFirestore, collection, addDoc }, cfg] = await Promise.all([
    import('firebase/app'), import('firebase/firestore'), import('../../firebase-applet-config.json'),
  ]);
  const config = cfg.default;
  const app = getApps()[0] ?? initializeApp(config);
  await addDoc(collection(getFirestore(app, config.firestoreDatabaseId), 'sessions'), payload);
}
