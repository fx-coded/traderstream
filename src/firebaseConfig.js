// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration using .env variables (fallback to hardcoded values if undefined)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC-z96xX6Iue1iTAzwtM0B7VxxQMR-uNlc",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "trader-stream-live.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "trader-stream-live",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "trader-stream-live.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "837535460839",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:837535460839:web:3e193ae876327a6cf22142",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-D3HL6SDZH7",
};

// ✅ Log project ID to confirm environment variables are loading
console.log("🔥 Firebase Project ID:", firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 🔥 Set Firebase Authentication Persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("✅ Firebase Auth persistence set to LOCAL"))
  .catch((error) => console.error("⚠️ Error setting auth persistence:", error));

// Export Firebase modules
export { app, analytics, auth, db, storage };
