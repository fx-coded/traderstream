const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Configure environment variables with defaults
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: CORS_ORIGIN },
  // Add pingTimeout to detect disconnections faster
  pingTimeout: 10000,
  // Add error handling for socket.io server
  connectTimeout: 10000
});

// Configure middleware
app.use(cors());
app.use(express.json());

// Add basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Data stores
const liveStreams = new Map(); // Using Map instead of object for better performance with large datasets
const viewers = new Map();     // Using Map for consistency and better operations

// Logging utility 
const logger = {
  info: (message) => console.log(`ℹ️ ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`❌ ${new Date().toISOString()} - ${message}`, error),
  warn: (message) => console.warn(`⚠️ ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`🔍 ${new Date().toISOString()} - ${message}`)
};

// Socket connection handler
io.on("connection", (socket) => {
  logger.info(`New connection: ${socket.id}`);

  // Start Streaming (Streamer Goes Live)
  socket.on("start-stream", (streamData) => {
    try {
      // Validate input data
      if (!streamData?.title || !streamData?.username) {
        socket.emit("error", { message: "Invalid stream data. Title and username are required." });
        logger.error("Invalid stream data received", { socketId: socket.id });
        return;
      }

      // Store stream data with timestamp for analytics
      const streamInfo = { 
        ...streamData, 
        socketId: socket.id,
        startTime: new Date().toISOString(),
        viewCount: 0
      };
      
      liveStreams.set(socket.id, streamInfo);
      viewers.set(socket.id, new Set()); // Using Set for unique viewers and O(1) operations

      // Notify all clients about the new stream
      io.emit("update-streams", Array.from(liveStreams.values()));
      logger.info(`Stream Started: ${streamData.username} (ID: ${socket.id})`);
      
      // Acknowledge stream start to streamer
      socket.emit("stream-started", { streamId: socket.id });
    } catch (error) {
      logger.error("Error in start-stream", error);
      socket.emit("error", { message: "Failed to start stream" });
    }
  });

  // Stop Streaming (Streamer Ends Live)
  socket.on("stop-stream", () => {
    try {
      if (liveStreams.has(socket.id)) {
        const streamData = liveStreams.get(socket.id);
        logger.info(`Stopping Stream: ${streamData.username} (ID: ${socket.id})`);
        
        // Notify viewers that stream is ending
        if (viewers.has(socket.id)) {
          const viewerSockets = viewers.get(socket.id);
          if (viewerSockets.size > 0) {
            io.to(Array.from(viewerSockets)).emit("stream-ended", { 
              streamerId: socket.id,
              message: "Stream has ended"
            });
          }
        }
        
        // Clean up resources
        liveStreams.delete(socket.id);
        viewers.delete(socket.id);

        // Update all clients with the current streams
        io.emit("update-streams", Array.from(liveStreams.values()));
        
        // Acknowledge stream stop to streamer
        socket.emit("stream-stopped");
      }
    } catch (error) {
      logger.error("Error in stop-stream", error);
      socket.emit("error", { message: "Failed to stop stream" });
    }
  });

  // Viewer Joins a Stream
  socket.on("join-stream", (streamerId) => {
    try {
      if (!liveStreams.has(streamerId)) {
        logger.warn(`Stream ${streamerId} no longer exists.`);
        socket.emit("error", { message: "Stream is no longer available" });
        return;
      }

      logger.info(`Viewer ${socket.id} joined stream ${streamerId}`);
      socket.join(streamerId);

      // Add viewer to the stream's viewer list
      if (!viewers.has(streamerId)) {
        viewers.set(streamerId, new Set());
      }
      
      viewers.get(streamerId).add(socket.id);
      const viewerCount = viewers.get(streamerId).size;
      
      // Update the stream's view count
      const streamData = liveStreams.get(streamerId);
      streamData.viewCount = viewerCount;
      liveStreams.set(streamerId, streamData);

      // Notify all viewers about the updated count
      io.to(streamerId).emit("viewer-count", viewerCount);
      
      // Confirm to the viewer they've joined
      socket.emit("joined-stream", { 
        streamerId,
        streamInfo: liveStreams.get(streamerId)
      });
      
      // Notify streamer about the new viewer
      io.to(streamerId).emit("viewer-joined", { viewerId: socket.id });
    } catch (error) {
      logger.error("Error in join-stream", error);
      socket.emit("error", { message: "Failed to join stream" });
    }
  });

  // Leave Stream (Viewer chooses to leave)
  socket.on("leave-stream", (streamerId) => {
    try {
      if (viewers.has(streamerId)) {
        viewers.get(streamerId).delete(socket.id);
        socket.leave(streamerId);
        
        // Update viewer count
        const viewerCount = viewers.get(streamerId).size;
        io.to(streamerId).emit("viewer-count", viewerCount);
        
        // Update streamer about viewer leaving
        io.to(streamerId).emit("viewer-left", { viewerId: socket.id });
        
        logger.info(`Viewer ${socket.id} left stream ${streamerId}`);
      }
    } catch (error) {
      logger.error("Error in leave-stream", error);
    }
  });

  // Handle WebRTC Offer (Streamer to Viewer)
  socket.on("offer", (data) => {
    try {
      // Validate required fields
      if (!data?.target || !data?.sdp) {
        socket.emit("error", { message: "Invalid WebRTC Offer data" });
        logger.error("Invalid WebRTC Offer received", { socketId: socket.id });
        return;
      }

      logger.info(`Sending Offer from ${socket.id} to ${data.target}`);
      
      // Forward the offer to the target viewer
      socket.to(data.target).emit("offer", { 
        sdp: data.sdp, 
        from: socket.id,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error("Error in offer", error);
      socket.emit("error", { message: "Failed to send offer" });
    }
  });

  // Handle WebRTC Answer (Viewer to Streamer)
  socket.on("answer", (data) => {
    try {
      // Validate required fields
      if (!data?.target || !data?.sdp) {
        socket.emit("error", { message: "Invalid WebRTC Answer data" });
        logger.error("Invalid WebRTC Answer received", { socketId: socket.id });
        return;
      }

      logger.info(`Answer sent from ${socket.id} to ${data.target}`);
      
      // Forward the answer to the target streamer
      socket.to(data.target).emit("answer", { 
        sdp: data.sdp, 
        from: socket.id,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error("Error in answer", error);
      socket.emit("error", { message: "Failed to send answer" });
    }
  });

  // Handle ICE Candidate Exchange
  socket.on("ice-candidate", (data) => {
    try {
      // Validate required fields
      if (!data?.candidate || !data?.target) {
        socket.emit("error", { message: "Invalid ICE Candidate data" });
        logger.error("Invalid ICE Candidate received", { socketId: socket.id });
        return;
      }

      logger.info(`ICE Candidate from ${socket.id} to ${data.target}`);
      
      // Forward the ICE candidate to the target
      socket.to(data.target).emit("ice-candidate", { 
        candidate: data.candidate,
        from: socket.id 
      });
    } catch (error) {
      logger.error("Error in ice-candidate", error);
      socket.emit("error", { message: "Failed to send ICE candidate" });
    }
  });

  // Handle User Disconnection (Auto Remove Stream or Viewer)
  socket.on("disconnect", () => {
    try {
      // If the disconnected socket was a streamer
      if (liveStreams.has(socket.id)) {
        const streamData = liveStreams.get(socket.id);
        logger.info(`Streamer Disconnected: ${streamData.username} (ID: ${socket.id})`);
        
        // Notify viewers that stream is ending due to disconnection
        if (viewers.has(socket.id)) {
          const viewerSockets = viewers.get(socket.id);
          if (viewerSockets.size > 0) {
            io.to(Array.from(viewerSockets)).emit("stream-ended", { 
              streamerId: socket.id,
              message: "Streamer disconnected"
            });
          }
        }
        
        // Clean up resources
        liveStreams.delete(socket.id);
        viewers.delete(socket.id);

        // Update all clients with the current streams
        io.emit("update-streams", Array.from(liveStreams.values()));
      } else {
        logger.info(`Viewer Disconnected: ${socket.id}`);

        // Remove viewer from all streams they might be watching
        for (const [streamerId, viewerSet] of viewers.entries()) {
          if (viewerSet.has(socket.id)) {
            viewerSet.delete(socket.id);
            
            // Update the viewer count for this stream
            const viewerCount = viewerSet.size;
            io.to(streamerId).emit("viewer-count", viewerCount);
            
            // Notify streamer about viewer disconnection
            io.to(streamerId).emit("viewer-left", { viewerId: socket.id });
            
            // Update stream's view count
            if (liveStreams.has(streamerId)) {
              const streamData = liveStreams.get(streamerId);
              streamData.viewCount = viewerCount;
              liveStreams.set(streamerId, streamData);
            }
          }
        }
      }
    } catch (error) {
      logger.error("Error in disconnect handler", error);
    }
  });
});

// Basic error middleware for Express
app.use((err, req, res, next) => {
  logger.error("Express error", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Handle Unexpected Errors (Prevents Crashes)
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", err);
  // In a production environment, you might want to implement graceful shutdown here
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", reason);
});

// Graceful Shutdown (CTRL+C)
process.on("SIGINT", () => {
  logger.info("Server shutting down...");
  
  // Notify all connected clients
  io.emit("server-shutdown", { message: "Server is shutting down" });
  
  // Close server
  server.close(() => {
    logger.info("Server shut down successfully.");
    process.exit(0);
  });
  
  // Force exit after timeout if server.close() hangs
  setTimeout(() => {
    logger.error("Server shutdown timed out, forcing exit");
    process.exit(1);
  }, 5000);
});

// Start Server
server.listen(PORT, () => logger.info(`WebRTC Signaling Server running on port ${PORT}`));

// Export server for testing purposes
module.exports = { app, server, io };