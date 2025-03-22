const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient, isRedisAvailable } = require('../config/redisClient');
const logger = require('../utils/logger');

/**
 * Create rate limiter with Redis store if available, otherwise memory store
 * @param {Object} options - Custom options for rate limiter
 * @returns {Function} Rate limiter middleware
 */
const createRateLimiter = (options = {}) => {
  try {
    // Create store based on Redis availability
    let store = undefined;
    
    if (isRedisAvailable()) {
      const redisClient = getRedisClient();
      if (redisClient) {
        store = new RedisStore({
          sendCommand: (...args) => redisClient.call(...args),
          prefix: 'rl:',
        });
        logger.info('Using Redis store for rate limiting');
      }
    }
    
    if (!store) {
      logger.info('Using memory store for rate limiting');
    }
    
    // Default rate limit options
    const defaultOptions = {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes by default
      max: process.env.NODE_ENV === 'production' ? 
        (process.env.RATE_LIMIT_MAX || 100) : 
        (process.env.RATE_LIMIT_MAX || 500), 
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests, please try again later." },
      store: store,
      // Dynamic limiter based on request type and user role
      keyGenerator: (req) => {
        const userIp = req.ip;
        const userRole = req.user ? req.user.role || 'authenticated' : 'anonymous';
        const requestPath = req.path;

        return `rate_limit:${userIp}:${userRole}:${requestPath}`;
      },
      // Skip rate limiting for certain conditions
      skip: (req) => {
        // Exempt authenticated admin users
        return req.user && req.user.role === 'admin';
      },
      handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          error: 'Too many requests, please try again later',
        });
      },
    };

    // Merge provided options with defaults
    const limiterOptions = { ...defaultOptions, ...options };
    
    return rateLimit(limiterOptions);
  } catch (error) {
    logger.error('Error creating rate limiter:', error);
    // Fallback to a memory-based rate limiter
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
};

// Default API limiter
const apiLimiter = createRateLimiter();

// More strict limiter for auth endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  message: { error: "Too many authentication attempts, please try again later." }
});

module.exports = {
  apiLimiter,
  authLimiter,
  createRateLimiter
};