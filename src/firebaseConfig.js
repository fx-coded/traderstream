// Import Firebase SDKs
import { 
  initializeApp, 
  getApp, 
  getApps 
} from "firebase/app";
import { 
  getAnalytics, 
  isSupported as isAnalyticsSupported
} from "firebase/analytics";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Logger utility
const logger = {
  info: (message) => console.log(`🔥 ${new Date().toISOString()} - ${message}`),
  warn: (message) => console.warn(`⚠️ ${new Date().toISOString()} - ${message}`),
  error: (message, error) => {
    console.error(`❌ ${new Date().toISOString()} - ${message}`, error || '');
  }
};

// Firebase configuration using .env variables with fallback
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC-z96xX6Iue1iTAzwtM0B7VxxQMR-uNlc",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "trader-stream-live.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "trader-stream-live",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "trader-stream-live.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "837535460839",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:837535460839:web:3e193ae876327a6cf22142",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-D3HL6SDZH7",
};

// Initialize Firebase app immediately
let firebaseApp;
if (getApps().length === 0) {
  logger.info(`Initializing Firebase for project: ${firebaseConfig.projectId}`);
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
  logger.info("Using existing Firebase app");
}

// Initialize Firebase services immediately (not asynchronously)
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
let analytics = null;

// Set up auth persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => logger.info("Auth persistence set to LOCAL"))
  .catch(error => logger.error("Auth persistence setup failed", error));

// Try to enable Firestore persistence
enableIndexedDbPersistence(db)
  .then(() => logger.info("Firestore indexed DB persistence enabled"))
  .catch(error => logger.warn("Firestore persistence setup failed", error));

// Initialize analytics if supported
isAnalyticsSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(firebaseApp);
    logger.info("Analytics initialized");
  } else {
    logger.warn("Analytics not supported");
  }
}).catch(error => {
  logger.error("Analytics initialization failed", error);
});

// Utility function to get analytics
export const getAnalyticsService = () => analytics;

// Export the Firebase services manager for compatibility
export const firebaseServices = {
  app: firebaseApp,
  auth,
  db,
  storage,
  getService: (serviceName) => {
    const serviceMap = {
      app: firebaseApp,
      auth,
      db,
      storage,
      analytics
    };

    if (!serviceMap[serviceName]) {
      logger.warn(`${serviceName} service not initialized`);
    }

    return serviceMap[serviceName];
  }
};