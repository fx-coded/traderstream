const admin = require('firebase-admin');
const logger = require('../utils/logger');

class FirebaseAdminService {
  constructor() {
    this.db = null;
    this.bucket = null;
    this.initialized = false;
  }

  // Validate required environment variables
  validateEnvironmentVariables() {
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID', 
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID',
      'FIREBASE_STORAGE_BUCKET'
    ];

    const missingVars = requiredVars.filter(key => !process.env[key]);
    
    if (missingVars.length > 0) {
      logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Critical environment variables missing');
      }
    }
  }

  // Prepare Firebase private key
  preparePrivateKey() {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey && !privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }
    return privateKey;
  }

  // Initialize Firebase Admin SDK
  initialize() {
    try {
      // Validate environment variables
      this.validateEnvironmentVariables();

      // Prevent multiple initializations
      if (admin.apps.length > 0) {
        logger.info('Firebase Admin already initialized');
        return this;
      }

      // Prepare service account configuration
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: this.preparePrivateKey(),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_EMAIL ? 
          `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}` : 
          '',
      };

      // Initialize Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });

      // Initialize services
      this.db = admin.firestore();
      this.bucket = admin.storage().bucket();
      this.initialized = true;

      logger.success("Firebase Admin Initialized Successfully");
      return this;
    } catch (error) {
      logger.error("Error initializing Firebase Admin SDK", error);
      
      // Fallback for production
      if (process.env.NODE_ENV === 'production') {
        this.createDummyServices();
      }
      
      return this;
    }
  }

  // Create dummy services for graceful degradation
  createDummyServices() {
    logger.warn("Creating dummy Firebase services");
    
    this.db = {
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: false, data: () => ({}) }),
          set: async () => logger.error("Firebase write failed - not initialized"),
          update: async () => logger.error("Firebase update failed - not initialized")
        }),
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              get: async () => ({ forEach: () => {} })
            })
          })
        }),
        add: async () => logger.error("Firebase add failed - not initialized")
      })
    };

    this.bucket = {
      upload: async () => logger.error("Storage upload failed - not initialized")
    };
  }

  // Perform health check
  async healthCheck() {
    if (!this.initialized) {
      return { 
        status: 'error', 
        message: 'Firebase services not initialized' 
      };
    }

    try {
      // Perform a simple Firestore read to check connectivity
      const testDoc = await this.db.collection('health-check')
        .doc('status')
        .get();

      return { 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      logger.error('Firebase health check failed', error);
      return { 
        status: 'degraded', 
        message: error.message 
      };
    }
  }

  getFirestore() {
    return this.db;
  }

  getStorage() {
    return this.bucket;
  }

  getAuth() {
    return admin.auth();
  }
}

// Create and initialize singleton instance
const firebaseAdminService = new FirebaseAdminService().initialize();

module.exports = firebaseAdminService;