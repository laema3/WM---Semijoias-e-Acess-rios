import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use environment variables if available, otherwise fallback to config file (for local dev)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  // Optional: Firestore database ID if using multiple databases
  ...(import.meta.env.VITE_FIRESTORE_DATABASE_ID ? { databaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID } : {})
};

// Fallback for local development if env vars are missing (using the JSON file content directly)
// This ensures it works in the preview environment without needing .env setup
export const finalConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAOBG5I0FZB4tNbvS5pG4UVeOHI1fMbJrM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0623147734.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0623147734",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0623147734.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "793033861196",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:793033861196:web:b7a0abb3358f598307ece9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  databaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || "ai-studio-11008128-bb01-4c25-86cb-ee15625d1147"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(finalConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Initialize services
// Use specific database ID if provided in config
export const db = app ? getFirestore(app, finalConfig.databaseId) : null as any;
export const auth = app ? getAuth(app) : null as any;
export const storage = app ? getStorage(app) : null as any;

export const checkConnection = async () => {
  if (!db) return false;
  try {
    // Attempt to fetch a dummy document to test connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};
