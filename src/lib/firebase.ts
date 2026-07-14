import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// সরাসরি আপনার MIA ONE প্রজেক্টের আসল ফায়ারবেস চাবিগুলো বসিয়ে দেওয়া হলো
const firebaseConfig = {
  apiKey: "AIzaSyA-gKMI2Z-0MgeVWQ1jLz2Ccod4DfHbehI",
  authDomain: "mia-one-5554d.firebaseapp.com",
  projectId: "mia-one-5554d",
  storageBucket: "mia-one-5554d.firebasestorage.app",
  messagingSenderId: "381664091119",
  appId: "1:381664091119:web:eec321e95b4741fb38741a",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
