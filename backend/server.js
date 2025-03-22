require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocketServer } = require('./services/socketService');
const logger = require('./utils/logger');
const { connectToRedis, closeRedisConnection } = require('./config/redisClient');
const firebaseAdminService = require('./config/firebaseAdmin');

// Use environment port with fallback
const PORT = parseInt(process.env.PORT || '5000', 10);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);

// Start the server
const startServer = async () => {
  try {
    // Connect to Redis if needed
    if (process.env.REDIS_ENABLED === 'true') {
      try {
        await connectToRedis();
      } catch (error) {
        logger.warn('Failed to connect to Redis, continuing without Redis:', error.message);
        // Continue anyway
      }
    } else {
      logger.info('Redis is disabled, skipping connection');
    }
    
    // Initialize Firebase Admin (already done by the import)
    logger.info('Firebase Admin service is ready');

    // Handle port binding errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Trying an alternative port.`);
        // Try another port
        server.listen(0); // Let OS assign a free port
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });

    // Start listening
    server.listen(PORT, () => {
      logger.success(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing connections...');
  
  // Notify all connected clients
  io.emit('server-shutdown', { message: 'Server is shutting down for maintenance' });
  
  // Close HTTP server
  server.close(() => {
    logger.success('HTTP server closed');
    
    // Close Redis connection if open
    closeRedisConnection().then(() => {
      logger.success('All connections closed, shutting down');
      process.exit(0);
    }).catch(err => {
      logger.error('Error closing Redis connection:', err);
      process.exit(1);
    });
  });
  
  // Force close if not done in 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle process termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Log but don't crash in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
  // Log but don't crash in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Start the server
startServer();

// Export for testing
module.exports = { app, server, io };