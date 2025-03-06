/**
 * Stream API Routes
 * Handling stream management and information
 */

const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

// Get Firestore instance
const db = admin.firestore();

// Rate limiting configuration
const streamLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 stream starts per window
  message: { error: "Too many stream requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware for validating user authentication
const validateAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization header missing or invalid" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken.uid) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

// 📌 Get Active Streams
router.get("/active", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 items per page
    const offset = (page - 1) * limit;
    
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
  } catch (error) {
    console.error("Get active streams error:", error);
    res.status(500).json({ 
      error: "Failed to retrieve active streams",
      message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"
    });
  }
});

// 📌 Get Stream Details
router.get("/:streamId", async (req, res) => {
  try {
    const { streamId } = req.params;
    
    const streamRef = db.collection("streams").doc(streamId);
    const stream = await streamRef.get();
    
    if (!stream.exists) {
      return res.status(404).json({ error: "Stream not found" });
    }
    
    const streamData = stream.data();
    
    res.json(streamData);
  } catch (error) {
    console.error("Get stream details error:", error);
    res.status(500).json({ 
      error: "Failed to retrieve stream details",
      message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"
    });
  }
});

// 📌 Start a Stream (via REST API - alternative to socket method)
router.post(
  "/start", 
  validateAuth, 
  streamLimiter,
  [
    check("title").trim().isLength({ min: 3, max: 100 }).withMessage("Title must be between 3 and 100 characters"),
  ],
  async (req, res) => {
    try {
      // Validate request parameters
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, tags } = req.body;
      const userId = req.user.uid;

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
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewers: 0,
        isLive: true,
        rtmpUrl: process.env.RTMP_URL,
      };

      // Save Stream Data in Firestore with automatic retries
      const streamRef = db.collection("streams").doc(streamKey);
      await streamRef.set(streamData);
      
      // Log stream start for analytics
      console.info(`Stream started via API: ${streamKey} by user ${userId}`);
      
      // Return success with streaming information
      res.status(201).json({
        success: true,
        message: "✅ Stream started successfully",
        streamKey,
        rtmpUrl: process.env.RTMP_URL,
        playbackUrl: `${process.env.PLAYBACK_BASE_URL}/${streamKey}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour expiration
      });
    } catch (error) {
      console.error("Stream start error:", error);
      res.status(500).json({ 
        error: "Failed to start stream",
        message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"
      });
    }
  }
);

// 📌 Stop a Stream (via REST API - alternative to socket method)
router.post(
  "/stop", 
  validateAuth,
  [
    check("streamKey").trim().notEmpty().withMessage("Stream key is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { streamKey } = req.body;
      const userId = req.user.uid;

      // Get stream data
      const streamRef = db.collection("streams").doc(streamKey);
      const stream = await streamRef.get();

      if (!stream.exists) {
        return res.status(404).json({ error: "Stream not found" });
      }

      const streamData = stream.data();
      
      // Verify ownership
      if (streamData.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to stop this stream" });
      }

      // Update stream
      await streamRef.update({
        isLive: false,
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
        duration: admin.firestore.FieldValue.increment(1) // This will be updated properly later
      });
      
      // Log stream stop
      console.info(`Stream stopped via API: ${streamKey} by user ${userId}`);
      
      res.json({ 
        success: true,
        message: "✅ Stream stopped successfully",
        streamKey
      });
    } catch (error) {
      console.error("Stream stop error:", error);
      res.status(500).json({ 
        error: "Failed to stop stream",
        message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"
      });
    }
  }
);

// 📌 Get Stream Chat Messages
router.get(
  "/:streamId/messages",
  async (req, res) => {
    try {
      const { streamId } = req.params;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 messages
      
      // Check if stream exists
      const streamRef = db.collection("streams").doc(streamId);
      const stream = await streamRef.get();
      
      if (!stream.exists) {
        return res.status(404).json({ error: "Stream not found" });
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
    } catch (error) {
      console.error("Get stream messages error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve stream messages",
        message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"
      });
    }
  }
);

// 📌 Get Stream Metrics
router.get(
  "/:streamId/metrics",
  validateAuth,
  async (req, res) => {
    try {
      const { streamId } = req.params;
      const userId = req.user.uid;
      
      // Get stream data
      const streamRef = db.collection("streams").doc(streamId);
      const stream = await streamRef.get();
      
      if (!stream.exists) {
        return res.status(404).json({ error: "Stream not found" });
      }
      
      const streamData = stream.data();
      
      // Check authorization (only owner can see metrics)
      if (streamData.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to view stream metrics" });
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
    } catch (error) {
      console.error("Get stream metrics error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve stream metrics",
        message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"
      });
    }
  }
);

// 📌 Update Stream Info
router.patch(
  "/:streamId",
  validateAuth,
  [
    check("title").optional().trim().isLength({ min: 3, max: 100 }).withMessage("Title must be between 3 and 100 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { streamId } = req.params;
      const userId = req.user.uid;
      const { title, description, tags } = req.body;
      
      // Get stream data
      const streamRef = db.collection("streams").doc(streamId);
      const stream = await streamRef.get();
      
      if (!stream.exists) {
        return res.status(404).json({ error: "Stream not found" });
      }
      
      const streamData = stream.data();
      
      // Verify ownership
      if (streamData.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this stream" });
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
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      res.json({ 
        success: true,
        message: "Stream information updated successfully",
        streamId
      });
    } catch (error) {
      console.error("Update stream error:", error);
      res.status(500).json({ 
        error: "Failed to update stream information",
        message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"
      });
    }
  }
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