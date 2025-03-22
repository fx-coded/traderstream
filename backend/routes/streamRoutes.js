/**
 * Stream API Routes
 * Handling stream management and information
 */

const express = require("express");
const { verifyToken, optionalAuth } = require('../middleware/authentication');
const logger = require('../utils/logger');
const firebaseAdminService = require('../config/firebaseAdmin');
const { asyncHandler, ApiError } = require('../utils/errorHandler');
const { check, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting configuration for stream creation
const streamLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 stream starts per window
  message: { error: "Too many stream requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// 📌 Get Active Streams
router.get("/active", asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 items per page
  const offset = (page - 1) * limit;
  
  const db = firebaseAdminService.getFirestore();
  
  // Query Firestore with pagination and sorting
  let query = db.collection("streams")
    .where("isLive", "==", true)
    .orderBy("startedAt", "desc")
    .limit(limit)
    .offset(offset);
  
  // Apply tag filter if provided
  if (req.query.tag) {
    query = query.where("tags", "array-contains", req.query.tag);
  }
  
  const snapshot = await query.get();
  
  const streams = [];
  snapshot.forEach(doc => {
    streams.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  // Get total count for pagination
  const countQuery = await db.collection("streams").where("isLive", "==", true).count().get();
  const total = countQuery.data().count;
  
  res.json({
    streams,
    page,
    limit,
    total
  });
}));

// 📌 Get Stream Details
router.get("/:streamId", asyncHandler(async (req, res) => {
  const { streamId } = req.params;
  const db = firebaseAdminService.getFirestore();
  
  const streamRef = db.collection("streams").doc(streamId);
  const stream = await streamRef.get();
  
  if (!stream.exists) {
    throw new ApiError(404, "Stream not found");
  }
  
  const streamData = stream.data();
  
  res.json(streamData);
}));

// 📌 Start a Stream (via REST API - alternative to socket method)
router.post(
  "/start", 
  verifyToken, 
  streamLimiter,
  [
    check("title").trim().isLength({ min: 3, max: 100 }).withMessage("Title must be between 3 and 100 characters"),
  ],
  asyncHandler(async (req, res) => {
    // Validate request parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation error", errors.array());
    }

    const { title, description, tags } = req.body;
    const userId = req.user.uid;
    const db = firebaseAdminService.getFirestore();

    // Generate Stream Key with additional entropy
    const randomBytes = require('crypto').randomBytes(8).toString('hex');
    const streamKey = `stream_${userId}_${Date.now()}_${randomBytes}`;
    
    // Prepare stream data with metadata
    const streamData = {
      id: streamKey,
      title,
      description: description || "",
      tags: tags || [],
      userId,
      displayName: req.user.name || req.user.email || "Anonymous",
      photoURL: req.user.picture || null,
      startedAt: new Date().toISOString(),
      viewers: 0,
      isLive: true,
      rtmpUrl: process.env.RTMP_URL || "rtmp://example.com/live",
    };

    // Save Stream Data in Firestore
    const streamRef = db.collection("streams").doc(streamKey);
    await streamRef.set(streamData);
    
    // Log stream start for analytics
    logger.info(`Stream started via API: ${streamKey} by user ${userId}`);
    
    // Return success with streaming information
    res.status(201).json({
      success: true,
      message: "✅ Stream started successfully",
      streamKey,
      rtmpUrl: process.env.RTMP_URL || "rtmp://example.com/live",
      playbackUrl: `${process.env.PLAYBACK_BASE_URL || "https://example.com/watch"}/${streamKey}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour expiration
    });
  })
);

// 📌 Stop a Stream (via REST API - alternative to socket method)
router.post(
  "/stop", 
  verifyToken,
  [
    check("streamKey").trim().notEmpty().withMessage("Stream key is required"),
  ],
  asyncHandler(async (req, res) => {
    // Validate request parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation error", errors.array());
    }

    const { streamKey } = req.body;
    const userId = req.user.uid;
    const db = firebaseAdminService.getFirestore();

    // Get stream data
    const streamRef = db.collection("streams").doc(streamKey);
    const stream = await streamRef.get();

    if (!stream.exists) {
      throw new ApiError(404, "Stream not found");
    }

    const streamData = stream.data();
    
    // Verify ownership
    if (streamData.userId !== userId) {
      throw new ApiError(403, "Not authorized to stop this stream");
    }

    // Calculate stream duration
    const startedAt = new Date(streamData.startedAt);
    const duration = (Date.now() - startedAt.getTime()) / 1000; // duration in seconds

    // Update stream
    await streamRef.update({
      isLive: false,
      endedAt: new Date().toISOString(),
      duration: duration
    });
    
    // Log stream stop
    logger.info(`Stream stopped via API: ${streamKey} by user ${userId}`);
    
    res.json({ 
      success: true,
      message: "✅ Stream stopped successfully",
      streamKey,
      duration: Math.round(duration)
    });
  })
);

// 📌 Get Stream Chat Messages
router.get(
  "/:streamId/messages",
  asyncHandler(async (req, res) => {
    const { streamId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 messages
    const db = firebaseAdminService.getFirestore();
    
    // Check if stream exists
    const streamRef = db.collection("streams").doc(streamId);
    const stream = await streamRef.get();
    
    if (!stream.exists) {
      throw new ApiError(404, "Stream not found");
    }
    
    // Get messages with pagination
    const messagesQuery = await db.collection("stream-messages")
      .where("streamId", "==", streamId)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();
    
    const messages = [];
    messagesQuery.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Return in chronological order
    res.json({
      streamId,
      messages: messages.reverse(),
      count: messages.length
    });
  })
);

// 📌 Get Stream Metrics
router.get(
  "/:streamId/metrics",
  verifyToken,
  asyncHandler(async (req, res) => {
    const { streamId } = req.params;
    const userId = req.user.uid;
    const db = firebaseAdminService.getFirestore();
    
    // Get stream data
    const streamRef = db.collection("streams").doc(streamId);
    const stream = await streamRef.get();
    
    if (!stream.exists) {
      throw new ApiError(404, "Stream not found");
    }
    
    const streamData = stream.data();
    
    // Check authorization (only owner can see metrics)
    if (streamData.userId !== userId) {
      throw new ApiError(403, "Not authorized to view stream metrics");
    }
    
    // Get viewer count over time (simplified example)
    // In a real implementation, you would have a time-series database or analytics service
    const metrics = {
      totalViewers: streamData.viewers || 0,
      peakViewers: streamData.peakViewers || 0,
      duration: streamData.duration || 0,
      messageCount: 0, // Placeholder - would be calculated from actual messages
      startTime: streamData.startedAt,
      endTime: streamData.endedAt || null
    };
    
    // Get message count
    const messagesCountQuery = await db.collection("stream-messages")
      .where("streamId", "==", streamId)
      .count()
      .get();
    
    metrics.messageCount = messagesCountQuery.data().count;
    
    res.json(metrics);
  })
);

// 📌 Update Stream Info
router.patch(
  "/:streamId",
  verifyToken,
  [
    check("title").optional().trim().isLength({ min: 3, max: 100 }).withMessage("Title must be between 3 and 100 characters"),
  ],
  asyncHandler(async (req, res) => {
    // Validate request parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation error", errors.array());
    }
    
    const { streamId } = req.params;
    const userId = req.user.uid;
    const { title, description, tags } = req.body;
    const db = firebaseAdminService.getFirestore();
    
    // Get stream data
    const streamRef = db.collection("streams").doc(streamId);
    const stream = await streamRef.get();
    
    if (!stream.exists) {
      throw new ApiError(404, "Stream not found");
    }
    
    const streamData = stream.data();
    
    // Verify ownership
    if (streamData.userId !== userId) {
      throw new ApiError(403, "Not authorized to update this stream");
    }
    
    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags) updateData.tags = tags;
    
    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await streamRef.update({
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    }
    
    res.json({ 
      success: true,
      message: "Stream information updated successfully",
      streamId
    });
  })
);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || "1.0.0",
    region: process.env.CLOUD_REGION || "unknown"
  });
});

module.exports = router;