const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
let redisEnabled = process.env.REDIS_ENABLED === 'true';

/**
 * Connect to Redis server
 * @returns {Promise<Redis|null>} Redis client or null if disabled
 */
const connectToRedis = async () => {
  // If Redis is disabled, don't attempt to connect
  if (!redisEnabled) {
    logger.info('Redis is disabled by configuration, skipping connection');
    return null;
  }

  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        // Stop retrying after 3 attempts
        if (times > 3) {
          logger.warn(`Redis connection failed after ${times} attempts, giving up`);
          return null; // stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Disconnect on error to prevent continuous reconnection attempts
      reconnectOnError: (err) => {
        logger.error('Redis reconnection error:', err.message);
        return false; // don't auto-reconnect
      },
      // Connection timeout
      connectTimeout: 10000,
    });

    // Setup event handlers
    redisClient.on('connect', () => {
      logger.success('Connected to Redis');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis error:', error);
      // If we get too many errors, disable Redis
      if (redisEnabled && error.code === 'ECONNREFUSED') {
        disableRedis();
      }
    });

    // Test connection
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Disable Redis if connection fails
    disableRedis();
    return null;
  }
};

/**
 * Disable Redis and fallback to in-memory operations
 */
const disableRedis = () => {
  logger.warn('Disabling Redis functionality due to connection issues');
  redisEnabled = false;
  
  // Close connection if it exists
  if (redisClient) {
    try {
      redisClient.disconnect();
    } catch (err) {
      // Ignore disconnect errors
    }
    redisClient = null;
  }
};

/**
 * Get Redis client instance
 * @returns {Redis|null} Redis client or null if disabled/not initialized
 */
const getRedisClient = () => {
  // If Redis is disabled, don't attempt to use it
  if (!redisEnabled) {
    return null;
  }
  
  if (!redisClient) {
    logger.warn('Redis client not initialized. Attempting to connect...');
    connectToRedis().catch(err => {
      logger.error('Failed to initialize Redis client:', err.message);
      disableRedis();
    });
  }
  
  return redisClient;
};

/**
 * Check if Redis is available
 * @returns {boolean} Whether Redis is enabled and connected
 */
const isRedisAvailable = () => {
  return redisEnabled && redisClient !== null;
};

/**
 * Close Redis connection
 */
const closeRedisConnection = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error.message);
    }
    redisClient = null;
  }
};

module.exports = {
  connectToRedis,
  getRedisClient,
  closeRedisConnection,
  isRedisAvailable
};