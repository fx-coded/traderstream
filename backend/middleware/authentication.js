const admin = require('firebase-admin');
const logger = require('../utils/logger');
const firebaseAdminService = require('../config/firebaseAdmin');

/**
 * Middleware to verify Firebase authentication token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
    }
    
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token not provided" });
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: "Token expired" });
      }
      res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication service error" });
  }
};

/**
 * Optional auth middleware - attaches user if token is present but doesn't block requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const decoded = await admin.auth().verifyIdToken(token);
          req.user = decoded;
        } catch (error) {
          // Just log and continue
          logger.warn("Optional auth token verification failed:", error.message);
        }
      }
    }
    next();
  } catch (error) {
    // Still continue even if auth fails
    logger.warn("Optional auth error:", error.message);
    next();
  }
};

/**
 * Middleware to check for admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: Authentication required" });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  next();
};

/**
 * Middleware to authenticate socket connections
 * @param {Object} socket - Socket.io socket
 * @param {Function} next - Next function
 */
const authenticateSocketConnection = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication token required"));
    }
    
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      socket.user = decoded;
      next();
    } catch (authError) {
      logger.error("Socket token verification error:", authError.message);
      next(new Error("Authentication failed: " + authError.message));
    }
  } catch (error) {
    logger.error("Socket authentication error:", error);
    next(new Error("Authentication process failed"));
  }
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireAdmin,
  authenticateSocketConnection
};