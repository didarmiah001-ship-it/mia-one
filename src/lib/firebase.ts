import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA-gKMI2Z-0MgeVWQ1jLz2Ccod4DfHbehI",
  authDomain: "mia-one-5554d.firebaseapp.com",
  projectId: "mia-one-5554d",
  storageBucket: "mia-one-5554d.firebasestorage.app",
  messagingSenderId: "381664091119",
  appId: "1:381664091119:web:eec321e95b4741fb38741a",
};

const app = initializeApp(firebaseConfig);

// Enable offline persistence with unlimited cache size so cached product data
// loads instantly on subsequent visits without waiting for network requests.
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  // Fallback if already initialized (e.g. HMR in dev)
  db = getFirestore(app);
}

export { db };
export const auth = getAuth(app);
