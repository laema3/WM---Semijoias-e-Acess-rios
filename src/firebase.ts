import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
const finalConfig = firebaseConfig.apiKey ? firebaseConfig : {
  "projectId": "gen-lang-client-0623147734",
  "appId": "1:793033861196:web:b7a0abb3358f598307ece9",
  "apiKey": "AIzaSyAOBG5I0FZB4tNbvS5pG4UVeOHI1fMbJrM",
  "authDomain": "gen-lang-client-0623147734.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-11008128-bb01-4c25-86cb-ee15625d1147",
  "storageBucket": "gen-lang-client-0623147734.firebasestorage.app",
  "messagingSenderId": "793033861196",
  "measurementId": ""
};

// Initialize Firebase
const app = initializeApp(finalConfig);

// Initialize services
// Use specific database ID if provided in config
export const db = getFirestore(app, (finalConfig as any).firestoreDatabaseId || (finalConfig as any).databaseId);
export const auth = getAuth(app);
