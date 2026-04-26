import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBBDb24smJ3efUDR1nlR17fu8nXtCU0RhU",
  authDomain: "shape-up-health-app.firebaseapp.com",
  projectId: "shape-up-health-app",
  storageBucket: "shape-up-health-app.firebasestorage.app",
  messagingSenderId: "1041181227844",
  appId: "1:1041181227844:web:e4d2e8e0f570c8d9a47511"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
