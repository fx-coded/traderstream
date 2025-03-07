// Import Firebase SDKs
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  initializeAuth,
  browserPopupRedirectResolver
} from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Logger utility
const logger = {
  info: (message) => console.log(`🔥 ${message}`),
  warn: (message) => console.warn(`⚠️ ${message}`),
  error: (message) => console.error(`❌ ${message}`)
};

// Firebase configuration using .env variables with fallback
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC-z96xX6Iue1iTAzwtM0B7VxxQMR-uNlc",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "trader-stream-live.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "trader-stream-live",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "trader-stream-live.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "837535460839",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:837535460839:web:3e193ae876327a6cf22142",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-D3HL6SDZH7",
};

// Initialize Firebase app (prevent multiple initializations)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics (with support check)
let analytics;
const initAnalytics = async () => {
  try {
    if (await isSupported()) {
      analytics = getAnalytics(app);
      logger.info("Analytics initialized successfully");
    } else {
      logger.warn("Analytics not supported in this environment");
    }
  } catch (error) {
    logger.error("Failed to initialize Analytics", error);
  }
};

// Initialize Auth with enhanced configuration
const auth = initializeAuth(app, {
  popupRedirectResolver: browserPopupRedirectResolver
});

// Initialize Firestore with persistence
const db = getFirestore(app);
const initFirestorePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db);
    logger.info("Firestore indexed DB persistence enabled");
  } catch (error) {
    logger.warn("Firestore persistence could not be enabled", error);
  }
};

// Initialize Storage
const storage = getStorage(app);

// Set Firebase Authentication Persistence
const setupAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    logger.info("Firebase Auth persistence set to LOCAL");
  } catch (error) {
    logger.error("Error setting auth persistence", error);
  }
};

// Initialize all services
const initializeFirebaseServices = async () => {
  try {
    // Log project details
    logger.info(`Initializing Firebase for project: ${firebaseConfig.projectId}`);

    // Initialize services
    await initAnalytics();
    await initFirestorePersistence();
    await setupAuthPersistence();

    logger.info("All Firebase services initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Firebase services", error);
  }
};

// Call initialization
initializeFirebaseServices();

// Export Firebase modules
export { 
  app, 
  analytics, 
  auth, 
  db, 
  storage,
  firebaseConfig 
};