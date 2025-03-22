const logger = require('../utils/logger');
const admin = require('firebase-admin');
const firebaseAdminService = require('../config/firebaseAdmin');

/**
 * Handle new socket connection
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.IO server instance
 * @param {Map} activeStreams - Map of active streams
 * @param {Map} userConnections - Map of user connections
 */
const handleConnection = (socket, io, activeStreams, userConnections) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  // Store user connection info
  if (socket.user) {
    const uid = socket.user.uid;
    if (!userConnections.has(uid)) {
      userConnections.set(uid, new Set());
    }
    userConnections.get(uid).add(socket.id);
    
    // Add to user's room for direct messaging
    socket.join(`user:${uid}`);
  }
  
  // Set up event handlers
  setupStreamEvents(socket, io, activeStreams, userConnections);
  setupWebRTCEvents(socket);
  setupChatEvents(socket, io);
  
  // Handle disconnection
  socket.on('disconnect', () => handleDisconnect(socket, io, activeStreams, userConnections));
};

/**
 * Set up stream-related event handlers
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.IO server instance
 * @param {Map} activeStreams - Map of active streams
 * @param {Map} userConnections - Map of user connections
 */
const setupStreamEvents = (socket, io, activeStreams, userConnections) => {
  const db = firebaseAdminService.getFirestore();
  
  // Handle starting a stream
  socket.on('start-stream', async (streamData) => {
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }
      
      if (!streamData || !streamData.title) {
        socket.emit('error', { message: 'Stream data invalid. Title is required.' });
        return;
      }
      
      const streamId = socket.id;
      const uid = socket.user.uid;
      
      // Create stream record with metadata
      const stream = {
        id: streamId,
        title: streamData.title,
        description: streamData.description || '',
        tags: streamData.tags || [],
        userId: uid,
        displayName: socket.user.name || socket.user.email || 'Anonymous',
        photoURL: socket.user.picture || null,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewers: 0,
        isLive: true
      };
      
      // Save to Firestore
      await db.collection('streams').doc(streamId).set(stream);
      
      // Add to active streams
      activeStreams.set(streamId, {
        ...stream,
        viewers: new Set(),
        startedAt: new Date()
      });
      
      // Join stream room
      socket.join(`stream:${streamId}`);
      
      // Broadcast new stream to all users
      io.emit('stream-added', {
        id: stream.id,
        title: stream.title,
        description: stream.description,
        tags: stream.tags,
        userId: stream.userId,
        displayName: stream.displayName,
        photoURL: stream.photoURL,
        viewers: 0
      });
      
      socket.emit('stream-started', { streamId });
      logger.info(`Stream started: ${streamId} by user ${uid}`);
    } catch (error) {
      logger.error('Error starting stream:', error);
      socket.emit('error', { message: 'Failed to start stream' });
    }
  });
  
  // Handle ending a stream
  socket.on('end-stream', async () => {
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }
      
      const streamId = socket.id;
      
      if (activeStreams.has(streamId)) {
        const stream = activeStreams.get(streamId);
        
        // Update Firestore
        await db.collection('streams').doc(streamId).update({
          isLive: false,
          endedAt: admin.firestore.FieldValue.serverTimestamp(),
          duration: admin.firestore.FieldValue.increment((new Date() - stream.startedAt) / 1000)
        });
        
        // Notify viewers
        io.to(`stream:${streamId}`).emit('stream-ended', { streamId });
        
        // Remove from active streams
        activeStreams.delete(streamId);
        
        // Broadcast stream removal
        io.emit('stream-removed', { streamId });
        
        logger.info(`Stream ended: ${streamId}`);
        socket.emit('stream-ended-confirmation');
      }
    } catch (error) {
      logger.error('Error ending stream:', error);
      socket.emit('error', { message: 'Failed to end stream' });
    }
  });
  
  // Handle joining a stream as viewer
  socket.on('join-stream', async (data) => {
    try {
      const { streamId } = data;
      
      if (!activeStreams.has(streamId)) {
        socket.emit('error', { message: 'Stream not found or no longer live' });
        return;
      }
      
      // Join the stream room
      socket.join(`stream:${streamId}`);
      
      // Add viewer to stream data
      const stream = activeStreams.get(streamId);
      stream.viewers.add(socket.id);
      
      // Track which stream this socket is viewing
      socket.currentStream = streamId;
      
      // Update viewer count
      const viewerCount = stream.viewers.size;
      io.to(`stream:${streamId}`).emit('viewer-count-updated', { streamId, count: viewerCount });
      
      // Update Firestore (but not on every viewer change to reduce writes)
      if (viewerCount % 5 === 0) { // Update every 5 viewers
        await db.collection('streams').doc(streamId).update({
          viewers: viewerCount
        });
      }
      
      logger.info(`Viewer ${socket.id} joined stream ${streamId}`);
      socket.emit('joined-stream', { 
        streamId,
        title: stream.title,
        description: stream.description,
        displayName: stream.displayName,
        viewerCount
      });
    } catch (error) {
      logger.error('Error joining stream:', error);
      socket.emit('error', { message: 'Failed to join stream' });
    }
  });
  
  // Handle leaving a stream
  socket.on('leave-stream', () => {
    try {
      const streamId = socket.currentStream;
      
      if (streamId && activeStreams.has(streamId)) {
        // Remove from viewers
        activeStreams.get(streamId).viewers.delete(socket.id);
        
        // Leave the room
        socket.leave(`stream:${streamId}`);
        
        // Update viewer count
        const viewerCount = activeStreams.get(streamId).viewers.size;
        io.to(`stream:${streamId}`).emit('viewer-count-updated', { streamId, count: viewerCount });
        
        // Clear current stream
        socket.currentStream = null;
        
        logger.info(`Viewer ${socket.id} left stream ${streamId}`);
      }
    } catch (error) {
      logger.error('Error leaving stream:', error);
    }
  });
};

/**
 * Set up WebRTC signaling events
 * @param {Object} socket - Socket instance
 */
const setupWebRTCEvents = (socket) => {
  // WebRTC Signaling - Offer
  socket.on('offer', data => {
    try {
      if (!data || !data.target || !data.sdp) {
        socket.emit('error', { message: 'Invalid offer data' });
        return;
      }
      
      // Forward offer to target
      socket.to(data.target).emit('offer', {
        sdp: data.sdp,
        from: socket.id
      });
    } catch (error) {
      logger.error('Error handling WebRTC offer:', error);
    }
  });
  
  // WebRTC Signaling - Answer
  socket.on('answer', data => {
    try {
      if (!data || !data.target || !data.sdp) {
        socket.emit('error', { message: 'Invalid answer data' });
        return;
      }
      
      // Forward answer to target
      socket.to(data.target).emit('answer', {
        sdp: data.sdp,
        from: socket.id
      });
    } catch (error) {
      logger.error('Error handling WebRTC answer:', error);
    }
  });
  
  // WebRTC Signaling - ICE Candidate
  socket.on('ice-candidate', data => {
    try {
      if (!data || !data.target || !data.candidate) {
        return;
      }
      
      // Forward ICE candidate to target
      socket.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        from: socket.id
      });
    } catch (error) {
      logger.error('Error handling ICE candidate:', error);
    }
  });
};

/**
 * Set up chat messaging events
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.IO server instance
 */
const setupChatEvents = (socket, io) => {
  const db = firebaseAdminService.getFirestore();
  
  // Handle chat messages
  socket.on('chat-message', data => {
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }
      
      if (!data.streamId || !data.message || !data.message.trim()) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }
      
      // Check if stream exists
      if (!activeStreams.has(data.streamId)) {
        socket.emit('error', { message: 'Stream not found' });
        return;
      }
      
      // Create message object
      const message = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        streamId: data.streamId,
        userId: socket.user.uid,
        displayName: socket.user.name || socket.user.email || 'Anonymous',
        photoURL: socket.user.picture || null,
        message: data.message.trim().substring(0, 500), // Limit message length
        timestamp: new Date().toISOString()
      };
      
      // Save to Firestore - wrapped in try/catch to prevent crashes
      try {
        db.collection('stream-messages').add(message);
      } catch (dbError) {
        logger.error('Failed to save chat message to database:', dbError);
        // Still broadcast the message even if saving fails
      }
      
      // Broadcast to all viewers
      io.to(`stream:${data.streamId}`).emit('chat-message', message);
    } catch (error) {
      logger.error('Error handling chat message:', error);
    }
  });
};

/**
 * Handle socket disconnection
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.IO server instance
 * @param {Map} activeStreams - Map of active streams
 * @param {Map} userConnections - Map of user connections
 */
const handleDisconnect = async (socket, io, activeStreams, userConnections) => {
  try {
    logger.info(`Socket disconnected: ${socket.id}`);
    const db = firebaseAdminService.getFirestore();
    
    // Handle user disconnection
    if (socket.user) {
      const uid = socket.user.uid;
      
      // Remove from user connections
      if (userConnections.has(uid)) {
        userConnections.get(uid).delete(socket.id);
        if (userConnections.get(uid).size === 0) {
          userConnections.delete(uid);
        }
      }
    }
    
    // Handle stream disconnection (if user was streaming)
    if (activeStreams.has(socket.id)) {
      const stream = activeStreams.get(socket.id);
      
      // Update Firestore
      try {
        await db.collection('streams').doc(socket.id).update({
          isLive: false,
          endedAt: admin.firestore.FieldValue.serverTimestamp(),
          duration: admin.firestore.FieldValue.increment((new Date() - stream.startedAt) / 1000),
          disconnected: true
        });
      } catch (dbError) {
        logger.error('Failed to update stream status on disconnect:', dbError);
      }
      
      // Notify viewers
      io.to(`stream:${socket.id}`).emit('stream-ended', { 
        streamId: socket.id,
        reason: 'disconnected'
      });
      
      // Remove from active streams
      activeStreams.delete(socket.id);
      
      // Broadcast stream removal
      io.emit('stream-removed', { streamId: socket.id });
      
      logger.info(`Stream ended (disconnection): ${socket.id}`);
    }
    
    // Handle viewer disconnection
    if (socket.currentStream && activeStreams.has(socket.currentStream)) {
      // Remove from viewers
      activeStreams.get(socket.currentStream).viewers.delete(socket.id);
      
      // Update viewer count
      const streamId = socket.currentStream;
      const viewerCount = activeStreams.get(streamId).viewers.size;
      io.to(`stream:${streamId}`).emit('viewer-count-updated', { streamId, count: viewerCount });
    }
  } catch (error) {
    logger.error('Error handling disconnection:', error);
    // No need to propagate this error
  }
};

module.exports = {
  handleConnection,
  setupStreamEvents,
  setupWebRTCEvents,
  setupChatEvents,
  handleDisconnect
};