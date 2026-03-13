import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
// Use specific database ID if provided in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const checkConnection = async () => {
  try {
    // Attempt to fetch a dummy document to test connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};
