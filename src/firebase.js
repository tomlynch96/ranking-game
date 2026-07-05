import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const configOk = Boolean(config.apiKey && config.databaseURL);

export const db = configOk ? getDatabase(initializeApp(config)) : null;

// Local development against `firebase emulators:start --only database`.
if (db && import.meta.env.VITE_FIREBASE_EMULATOR) {
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
}
