const express = require('express');
const { asyncHandler, ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const firebaseAdminService = require('../config/firebaseAdmin');
const { verifyToken } = require('../middleware/authentication');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user after Firebase Auth signup
 * @access Public
 */
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  try {
    const { idToken, displayName } = req.body;
    
    if (!idToken) {
      throw new ApiError(400, 'ID token is required');
    }
    
    // Verify the ID token
    const auth = firebaseAdminService.getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, email_verified } = decodedToken;
    
    const db = firebaseAdminService.getFirestore();
    
    // Check if user already exists in our database
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (userDoc.exists) {
      // Update login timestamp
      await db.collection('users').doc(uid).update({
        lastLogin: new Date().toISOString()
      });
      
      return res.status(200).json({
        message: 'User already exists',
        user: {
          uid,
          email,
          displayName: userDoc.data().displayName,
          photoURL: userDoc.data().photoURL,
          role: userDoc.data().role || 'user'
        }
      });
    }
    
    // Create new user in our database
    const userData = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      emailVerified: email_verified || false,
      photoURL: decodedToken.picture || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      streamSubscriptions: [],
      streams: 0,
      followers: 0,
      following: 0,
      role: 'user' // Default role
    };
    
    await db.collection('users').doc(uid).set(userData);
    
    logger.info(`New user registered: ${uid}`);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid,
        email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: userData.role
      }
    });
  } catch (error) {
    logger.error('Error registering user:', error);
    
    if (error.code === 'auth/id-token-expired') {
      throw new ApiError(401, 'ID token expired');
    } else if (error.code === 'auth/id-token-revoked') {
      throw new ApiError(401, 'ID token revoked');
    } else if (error.code === 'auth/invalid-id-token') {
      throw new ApiError(401, 'Invalid ID token');
    } else if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(500, 'Failed to register user');
    }
  }
}));

/**
 * @route POST /api/auth/verify-token
 * @desc Verify Firebase ID token
 * @access Public
 */
router.post('/verify-token', authLimiter, asyncHandler(async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      throw new ApiError(400, 'ID token is required');
    }
    
    // Verify the ID token
    const auth = firebaseAdminService.getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    res.status(200).json({
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false
    });
  } catch (error) {
    logger.warn('Token verification failed:', error.message);
    
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({
        valid: false,
        error: 'ID token expired'
      });
    } else if (error.code === 'auth/id-token-revoked') {
      res.status(401).json({
        valid: false,
        error: 'ID token revoked'
      });
    } else if (error.code === 'auth/invalid-id-token') {
      res.status(401).json({
        valid: false,
        error: 'Invalid ID token'
      });
    } else {
      res.status(401).json({
        valid: false,
        error: 'Token validation failed'
      });
    }
  }
}));

/**
 * @route POST /api/auth/logout
 * @desc Log out a user (update last activity)
 * @access Private
 */
router.post('/logout', verifyToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.uid;
    const db = firebaseAdminService.getFirestore();
    
    // Update last logout timestamp
    await db.collection('users').doc(userId).update({
      lastLogout: new Date().toISOString()
    });
    
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Error logging out user:', error);
    throw new ApiError(500, 'Failed to log out user');
  }
}));

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh user's session token
 * @access Public
 */
router.post('/refresh-token', authLimiter, asyncHandler(async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }
    
    // Note: Firebase Admin SDK doesn't directly support refresh token validation/exchange
    // You'd need to use Firebase Auth REST API or client SDKs for this functionality
    // This is just a placeholder for the route
    
    res.status(501).json({ message: 'Functionality not implemented on server. Use Firebase client SDK.' });
  } catch (error) {
    logger.error('Error refreshing token:', error);
    throw new ApiError(500, 'Failed to refresh token');
  }
}));

module.exports = router;