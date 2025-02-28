const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const WebSocket = require("ws");
const helmet = require("helmet"); // Security middleware
const compression = require("compression"); // Response compression
const rateLimit = require("express-rate-limit"); // Rate limiting
const morgan = require("morgan"); // HTTP request logging
require("dotenv").config();

// ===================================
// Logger Configuration
// ===================================
const logger = {
  info: (message) => console.log(`ℹ️ ${new Date().toISOString()} - ${message}`),
  warn: (message) => console.warn(`⚠️ ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`❌ ${new Date().toISOString()} - ${message}`, error || ''),
  success: (message) => console.log(`✅ ${new Date().toISOString()} - ${message}`),
};

// ===================================
// Environment Variables Validation
// ===================================
const requiredEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_CLIENT_ID",
  "STORAGE_BUCKET",
  "FRONTEND_URL"
];

const missingVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  // Only exit in production; in development continue with warnings
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// ===================================
// Firebase Admin Setup
// ===================================
let db, bucket;
try {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID, // Fixed variable name (was REACT_APP_)
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || '',
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_EMAIL ? 
      `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}` : 
      '',
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGE_BUCKET,
  });

  db = admin.firestore();
  bucket = admin.storage().bucket();
  
  logger.success("Firebase Admin Initialized Successfully");
} catch (error) {
  logger.error("Error initializing Firebase Admin SDK:", error);
  process.exit(1);
}

// ===================================
// Express App Setup
// ===================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: process.env.FRONTEND_URL || "*" },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
  pingTimeout: 10000,
  pingInterval: 25000,
});

// ===================================
// Middleware Configuration
// ===================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Compression for all responses
app.use(compression());

// HTTP request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});
app.use('/api/', apiLimiter);

// ===================================
// Authentication Middleware
// ===================================
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

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Optional auth middleware for endpoints that need user info but can still work without it
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded;
      }
    }
    next();
  } catch (error) {
    // Still continue even if auth fails
    next();
  }
};

// ===================================
// Socket.io Authentication and Setup
// ===================================
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication token required"));
    }
    
    const decoded = await admin.auth().verifyIdToken(token);
    socket.user = decoded;
    next();
  } catch (error) {
    logger.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
});

// Track active streams and connections
const activeStreams = new Map();
const userConnections = new Map();

io.on("connection", (socket) => {
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
  
  // Handle starting a stream
  socket.on("start-stream", async (streamData) => {
    try {
      if (!socket.user) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }
      
      if (!streamData || !streamData.title) {
        socket.emit("error", { message: "Stream data invalid. Title is required." });
        return;
      }
      
      const streamId = socket.id;
      const uid = socket.user.uid;
      
      // Create stream record with metadata
      const stream = {
        id: streamId,
        title: streamData.title,
        description: streamData.description || "",
        tags: streamData.tags || [],
        userId: uid,
        displayName: socket.user.name || socket.user.email || "Anonymous",
        photoURL: socket.user.picture || null,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewers: 0,
        isLive: true
      };
      
      // Save to Firestore
      await db.collection("streams").doc(streamId).set(stream);
      
      // Add to active streams
      activeStreams.set(streamId, {
        ...stream,
        viewers: new Set(),
        startedAt: new Date()
      });
      
      // Join stream room
      socket.join(`stream:${streamId}`);
      
      // Broadcast new stream to all users
      io.emit("stream-added", {
        id: stream.id,
        title: stream.title,
        description: stream.description,
        tags: stream.tags,
        userId: stream.userId,
        displayName: stream.displayName,
        photoURL: stream.photoURL,
        viewers: 0
      });
      
      socket.emit("stream-started", { streamId });
      logger.info(`Stream started: ${streamId} by user ${uid}`);
    } catch (error) {
      logger.error("Error starting stream:", error);
      socket.emit("error", { message: "Failed to start stream" });
    }
  });
  
  // Handle ending a stream
  socket.on("end-stream", async () => {
    try {
      if (!socket.user) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }
      
      const streamId = socket.id;
      
      if (activeStreams.has(streamId)) {
        const stream = activeStreams.get(streamId);
        
        // Update Firestore
        await db.collection("streams").doc(streamId).update({
          isLive: false,
          endedAt: admin.firestore.FieldValue.serverTimestamp(),
          duration: admin.firestore.FieldValue.increment((new Date() - stream.startedAt) / 1000)
        });
        
        // Notify viewers
        io.to(`stream:${streamId}`).emit("stream-ended", { streamId });
        
        // Remove from active streams
        activeStreams.delete(streamId);
        
        // Broadcast stream removal
        io.emit("stream-removed", { streamId });
        
        logger.info(`Stream ended: ${streamId}`);
        socket.emit("stream-ended-confirmation");
      }
    } catch (error) {
      logger.error("Error ending stream:", error);
      socket.emit("error", { message: "Failed to end stream" });
    }
  });
  
  // Handle joining a stream as viewer
  socket.on("join-stream", async (data) => {
    try {
      const { streamId } = data;
      
      if (!activeStreams.has(streamId)) {
        socket.emit("error", { message: "Stream not found or no longer live" });
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
      io.to(`stream:${streamId}`).emit("viewer-count-updated", { streamId, count: viewerCount });
      
      // Update Firestore (but not on every viewer change to reduce writes)
      if (viewerCount % 5 === 0) { // Update every 5 viewers
        await db.collection("streams").doc(streamId).update({
          viewers: viewerCount
        });
      }
      
      logger.info(`Viewer ${socket.id} joined stream ${streamId}`);
      socket.emit("joined-stream", { 
        streamId,
        title: stream.title,
        description: stream.description,
        displayName: stream.displayName,
        viewerCount
      });
    } catch (error) {
      logger.error("Error joining stream:", error);
      socket.emit("error", { message: "Failed to join stream" });
    }
  });
  
  // Handle leaving a stream
  socket.on("leave-stream", () => {
    try {
      const streamId = socket.currentStream;
      
      if (streamId && activeStreams.has(streamId)) {
        // Remove from viewers
        activeStreams.get(streamId).viewers.delete(socket.id);
        
        // Leave the room
        socket.leave(`stream:${streamId}`);
        
        // Update viewer count
        const viewerCount = activeStreams.get(streamId).viewers.size;
        io.to(`stream:${streamId}`).emit("viewer-count-updated", { streamId, count: viewerCount });
        
        // Clear current stream
        socket.currentStream = null;
        
        logger.info(`Viewer ${socket.id} left stream ${streamId}`);
      }
    } catch (error) {
      logger.error("Error leaving stream:", error);
    }
  });
  
  // WebRTC Signaling
  socket.on("offer", data => {
    try {
      if (!data || !data.target || !data.sdp) {
        socket.emit("error", { message: "Invalid offer data" });
        return;
      }
      
      // Forward offer to target
      socket.to(data.target).emit("offer", {
        sdp: data.sdp,
        from: socket.id
      });
    } catch (error) {
      logger.error("Error handling WebRTC offer:", error);
    }
  });
  
  socket.on("answer", data => {
    try {
      if (!data || !data.target || !data.sdp) {
        socket.emit("error", { message: "Invalid answer data" });
        return;
      }
      
      // Forward answer to target
      socket.to(data.target).emit("answer", {
        sdp: data.sdp,
        from: socket.id
      });
    } catch (error) {
      logger.error("Error handling WebRTC answer:", error);
    }
  });
  
  socket.on("ice-candidate", data => {
    try {
      if (!data || !data.target || !data.candidate) {
        return;
      }
      
      // Forward ICE candidate to target
      socket.to(data.target).emit("ice-candidate", {
        candidate: data.candidate,
        from: socket.id
      });
    } catch (error) {
      logger.error("Error handling ICE candidate:", error);
    }
  });
  
  // Handle chat messages
  socket.on("chat-message", data => {
    try {
      if (!socket.user) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }
      
      if (!data.streamId || !data.message || !data.message.trim()) {
        socket.emit("error", { message: "Invalid message data" });
        return;
      }
      
      // Check if stream exists
      if (!activeStreams.has(data.streamId)) {
        socket.emit("error", { message: "Stream not found" });
        return;
      }
      
      // Create message object
      const message = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        streamId: data.streamId,
        userId: socket.user.uid,
        displayName: socket.user.name || socket.user.email || "Anonymous",
        photoURL: socket.user.picture || null,
        message: data.message.trim().substring(0, 500), // Limit message length
        timestamp: new Date().toISOString()
      };
      
      // Save to Firestore
      db.collection("stream-messages").add(message);
      
      // Broadcast to all viewers
      io.to(`stream:${data.streamId}`).emit("chat-message", message);
    } catch (error) {
      logger.error("Error handling chat message:", error);
    }
  });
  
  // Handle disconnection
  socket.on("disconnect", async () => {
    try {
      logger.info(`Socket disconnected: ${socket.id}`);
      
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
        await db.collection("streams").doc(socket.id).update({
          isLive: false,
          endedAt: admin.firestore.FieldValue.serverTimestamp(),
          duration: admin.firestore.FieldValue.increment((new Date() - stream.startedAt) / 1000),
          disconnected: true
        });
        
        // Notify viewers
        io.to(`stream:${socket.id}`).emit("stream-ended", { 
          streamId: socket.id,
          reason: "disconnected"
        });
        
        // Remove from active streams
        activeStreams.delete(socket.id);
        
        // Broadcast stream removal
        io.emit("stream-removed", { streamId: socket.id });
        
        logger.info(`Stream ended (disconnection): ${socket.id}`);
      }
      
      // Handle viewer disconnection
      if (socket.currentStream && activeStreams.has(socket.currentStream)) {
        // Remove from viewers
        activeStreams.get(socket.currentStream).viewers.delete(socket.id);
        
        // Update viewer count
        const streamId = socket.currentStream;
        const viewerCount = activeStreams.get(streamId).viewers.size;
        io.to(`stream:${streamId}`).emit("viewer-count-updated", { streamId, count: viewerCount });
      }
    } catch (error) {
      logger.error("Error handling disconnection:", error);
    }
  });
});

// ===================================
// API Routes
// ===================================

// Public routes
app.get("/", (req, res) => {
  res.send("🔥 Trader Stream Backend is Running! 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get active streams (public)
app.get("/api/streams", optionalAuth, async (req, res) => {
  try {
    // Convert Map to Array and format for response
    const streams = Array.from(activeStreams.values()).map(stream => ({
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
    
    res.status(200).json(streams);
  } catch (error) {
    logger.error("Error fetching streams:", error);
    res.status(500).json({ error: "Failed to fetch streams" });
  }
});

// Protected routes
const apiRouter = express.Router();
app.use("/api", apiRouter);

// Get user profile
apiRouter.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get user profile from Firestore
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      // Create user profile if it doesn't exist
      const userData = {
        uid: userId,
        displayName: req.user.name || req.user.email || "Anonymous",
        email: req.user.email,
        photoURL: req.user.picture || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        streams: 0,
        followers: 0,
        following: 0
      };
      
      await db.collection("users").doc(userId).set(userData);
      
      res.status(200).json(userData);
    } else {
      res.status(200).json(userDoc.data());
    }
  } catch (error) {
    logger.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Update user profile
apiRouter.put("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { displayName, bio } = req.body;
    
    if (!displayName) {
      return res.status(400).json({ error: "Display name is required" });
    }
    
    // Update user profile
    await db.collection("users").doc(userId).update({
      displayName,
      bio: bio || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
});

// Get user's stream history
apiRouter.get("/streams/history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get user's past streams
    const streamsSnapshot = await db.collection("streams")
      .where("userId", "==", userId)
      .orderBy("startedAt", "desc")
      .limit(20)
      .get();
    
    const streams = [];
    streamsSnapshot.forEach(doc => {
      streams.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json(streams);
  } catch (error) {
    logger.error("Error fetching stream history:", error);
    res.status(500).json({ error: "Failed to fetch stream history" });
  }
});

// ===================================
// Error Handling
// ===================================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Express error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ===================================
// Process Error Handling
// ===================================
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  // Implement your preferred error reporting service here
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection:", reason);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info("Received shutdown signal, closing connections...");
  
  // Notify all connected clients
  io.emit("server-shutdown", { message: "Server is shutting down for maintenance" });
  
  // Close HTTP server
  server.close(() => {
    logger.success("HTTP server closed");
    
    // Close any other connections (e.g., database)
    process.exit(0);
  });
  
  // Force close if not done in 10 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// ===================================
// Start Server
// ===================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.success(`Server running on port ${PORT}`);
});

// Export for testing
module.exports = { app, server, io };