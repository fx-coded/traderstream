const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { authenticateSocketConnection } = require('../middleware/authentication');
const firebaseAdminService = require('../config/firebaseAdmin');
const socketEvents = require('../socket/socketEvents');

// Track active streams and connections
const activeStreams = new Map();
const userConnections = new Map();

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
const initSocketServer = (server) => {
  logger.info('Initializing Socket.IO server');
  
  // Create socket.io server with fault-tolerant settings
  const io = new Server(server, { 
    cors: { 
      origin: process.env.FRONTEND_URL || "*",
      credentials: true
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
    pingTimeout: 10000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'] // Fallback to polling if websocket fails
  });

  // Apply authentication middleware
  io.use(authenticateSocketConnection);

  // Set up connection handler
  io.on('connection', (socket) => socketEvents.handleConnection(socket, io, activeStreams, userConnections));

  // Handle server shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, closing Socket.IO connections...');
    io.emit('server-shutdown', { message: 'Server is shutting down for maintenance' });
  });

  return io;
};

/**
 * Get active streams
 * @returns {Array} Array of active streams
 */
const getActiveStreams = () => {
  return Array.from(activeStreams.values()).map(stream => ({
    id: stream.id,
    title: stream.title,
    description: stream.description,
    tags: stream.tags,
    userId: stream.userId,
    displayName: stream.displayName,
    photoURL: stream.photoURL,
    viewers: stream.viewers.size,
    startedAt: stream.startedAt
  }));
};

/**
 * Get a specific active stream by ID
 * @param {string} streamId - Stream ID
 * @returns {Object|null} Stream object or null if not found
 */
const getStreamById = (streamId) => {
  if (!activeStreams.has(streamId)) {
    return null;
  }

  const stream = activeStreams.get(streamId);
  return {
    id: stream.id,
    title: stream.title,
    description: stream.description,
    tags: stream.tags,
    userId: stream.userId,
    displayName: stream.displayName,
    photoURL: stream.photoURL,
    viewers: stream.viewers.size,
    startedAt: stream.startedAt
  };
};

/**
 * Check if a user is online
 * @param {string} userId - User ID
 * @returns {boolean} Whether user is online
 */
const isUserOnline = (userId) => {
  return userConnections.has(userId) && userConnections.get(userId).size > 0;
};

/**
 * Get online users count
 * @returns {number} Count of online users
 */
const getOnlineUsersCount = () => {
  return userConnections.size;
};

module.exports = {
  initSocketServer,
  getActiveStreams,
  getStreamById,
  isUserOnline,
  getOnlineUsersCount
};