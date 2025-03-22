const logger = require('../utils/logger');
const firebaseAdminService = require('../config/firebaseAdmin');
const { getRedisClient } = require('../config/redisClient');

/**
 * Service for handling stream-related operations
 */
class StreamService {
  constructor() {
    this.db = firebaseAdminService.getFirestore();
    this.redis = getRedisClient();
  }

  /**
   * Get all active streams from database
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of stream objects
   */
  async getActiveStreams(options = {}) {
    try {
      const { limit = 20, offset = 0, tags = null } = options;
      
      let query = this.db.collection('streams')
        .where('isLive', '==', true)
        .orderBy('viewers', 'desc');
      
      // Filter by tags if provided
      if (tags && Array.isArray(tags) && tags.length > 0) {
        query = query.where('tags', 'array-contains-any', tags);
      }
      
      // Apply pagination - Firestore doesn't support offset directly, so we need to use startAfter
      if (offset > 0) {
        // Get the last document from the previous batch
        const snapshot = await this.db.collection('streams')
          .where('isLive', '==', true)
          .orderBy('viewers', 'desc')
          .limit(offset)
          .get();
        
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
      
      // Apply limit
      query = query.limit(limit);
      
      const snapshot = await query.get();
      
      const streams = [];
      snapshot.forEach(doc => {
        streams.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return streams;
    } catch (error) {
      logger.error('Error fetching active streams:', error);
      throw error;
    }
  }

  /**
   * Get a stream by ID
   * @param {string} streamId - Stream ID
   * @returns {Promise<Object|null>} Stream object or null if not found
   */
  async getStreamById(streamId) {
    try {
      // Try to get from Redis cache first
      const cacheKey = `stream:${streamId}`;
      const cachedStream = await this.redis.get(cacheKey);
      
      if (cachedStream) {
        return JSON.parse(cachedStream);
      }
      
      // If not in cache, get from Firestore
      const streamDoc = await this.db.collection('streams').doc(streamId).get();
      
      if (!streamDoc.exists) {
        return null;
      }
      
      const stream = {
        id: streamDoc.id,
        ...streamDoc.data()
      };
      
      // Cache for 1 minute (60 seconds)
      await this.redis.set(cacheKey, JSON.stringify(stream), 'EX', 60);
      
      return stream;
    } catch (error) {
      logger.error(`Error fetching stream with ID ${streamId}:`, error);
      throw error;
    }
  }

  /**
   * Get stream messages
   * @param {string} streamId - Stream ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of message objects
   */
  async getStreamMessages(streamId, options = {}) {
    try {
      const { limit = 50, before = null } = options;
      
      let query = this.db.collection('stream-messages')
        .where('streamId', '==', streamId)
        .orderBy('timestamp', 'desc');
      
      // Apply time filter if provided
      if (before) {
        query = query.where('timestamp', '<', before);
      }
      
      // Apply limit
      query = query.limit(limit);
      
      const snapshot = await query.get();
      
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Return in chronological order
      return messages.reverse();
    } catch (error) {
      logger.error(`Error fetching messages for stream ${streamId}:`, error);
      throw error;
    }
  }

  /**
   * Search streams by title, description, or tags
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of stream objects
   */
  async searchStreams(searchTerm, options = {}) {
    try {
      const { limit = 20, activeOnly = true } = options;
      
      // Convert search term to lowercase for case-insensitive search
      const searchTermLower = searchTerm.toLowerCase();
      
      // Base query - can be extended with Firestore search indexes if needed
      let query = this.db.collection('streams');
      
      if (activeOnly) {
        query = query.where('isLive', '==', true);
      }
      
      // Get all streams matching the active filter
      const snapshot = await query.get();
      
      // Filter client-side for simple text search
      // Note: For production, consider using Algolia or Elasticsearch for better search
      const matches = [];
      snapshot.forEach(doc => {
        const stream = doc.data();
        if (
          stream.title.toLowerCase().includes(searchTermLower) ||
          (stream.description && stream.description.toLowerCase().includes(searchTermLower)) ||
          (stream.tags && stream.tags.some(tag => tag.toLowerCase().includes(searchTermLower)))
        ) {
          matches.push({
            id: doc.id,
            ...stream
          });
        }
      });
      
      return matches.slice(0, limit);
    } catch (error) {
      logger.error(`Error searching streams with term "${searchTerm}":`, error);
      throw error;
    }
  }

  /**
   * Get streams by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of stream objects
   */
  async getStreamsByUser(userId, options = {}) {
    try {
      const { limit = 20, includeEnded = true } = options;
      
      let query = this.db.collection('streams')
        .where('userId', '==', userId)
        .orderBy('startedAt', 'desc')
        .limit(limit);
      
      // Only get active streams if includeEnded is false
      if (!includeEnded) {
        query = this.db.collection('streams')
          .where('userId', '==', userId)
          .where('isLive', '==', true)
          .orderBy('startedAt', 'desc')
          .limit(limit);
      }
      
      const snapshot = await query.get();
      
      const streams = [];
      snapshot.forEach(doc => {
        streams.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return streams;
    } catch (error) {
      logger.error(`Error fetching streams for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get stream analytics
   * @param {string} streamId - Stream ID
   * @returns {Promise<Object>} Stream analytics data
   */
  async getStreamAnalytics(streamId) {
    try {
      // Get stream details
      const stream = await this.getStreamById(streamId);
      
      if (!stream) {
        throw new Error(`Stream with ID ${streamId} not found`);
      }
      
      // Get message count
      const messagesSnapshot = await this.db.collection('stream-messages')
        .where('streamId', '==', streamId)
        .count()
        .get();
      
      const messageCount = messagesSnapshot.data().count;
      
      // Calculate duration if the stream has ended
      let duration = 0;
      if (stream.endedAt) {
        const startTime = stream.startedAt.toDate ? stream.startedAt.toDate() : new Date(stream.startedAt);
        const endTime = stream.endedAt.toDate ? stream.endedAt.toDate() : new Date(stream.endedAt);
        duration = (endTime - startTime) / 1000; // in seconds
      }
      
      return {
        streamId,
        title: stream.title,
        userId: stream.userId,
        displayName: stream.displayName,
        isLive: stream.isLive,
        startedAt: stream.startedAt,
        endedAt: stream.endedAt || null,
        duration,
        peakViewers: stream.viewers || 0,
        messageCount
      };
    } catch (error) {
      logger.error(`Error fetching analytics for stream ${streamId}:`, error);
      throw error;
    }
  }
}

module.exports = new StreamService();