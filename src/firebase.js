import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Default Firebase project. This web config is public by design (it ships in
// the served JS bundle); access control is enforced by the database rules.
// A .env file with VITE_FIREBASE_* values overrides these for other projects.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCwKqCdBwk4q3QQaMh5a9jIfveHwT78PSw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ranking-game-44c68.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://ranking-game-44c68-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ranking-game-44c68',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:425690146263:web:983969bf34d485bd8e9792',
};

export const configOk = Boolean(config.apiKey && config.databaseURL);

export const db = configOk ? getDatabase(initializeApp(config)) : null;

// Local development against `firebase emulators:start --only database`.
if (db && import.meta.env.VITE_FIREBASE_EMULATOR) {
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
}
