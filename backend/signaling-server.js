const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

let liveStreams = {}; // Stores active streams (streamerId -> streamData)
let viewers = {}; // Stores viewers per stream

io.on("connection", (socket) => {
  console.log(`🔗 New connection: ${socket.id}`);

  // ✅ Start Streaming (Streamer Goes Live)
  socket.on("start-stream", (streamData) => {
    try {
      if (!streamData || !streamData.title) {
        console.error("❌ Invalid stream data received!");
        return;
      }

      liveStreams[socket.id] = { ...streamData, socketId: socket.id };
      viewers[socket.id] = [];

      io.emit("update-streams", Object.values(liveStreams));
      console.log(`📡 Stream Started: ${streamData.username} (ID: ${socket.id})`);
    } catch (error) {
      console.error("❌ Error in start-stream:", error);
    }
  });

  // ✅ Stop Streaming (Streamer Ends Live)
  socket.on("stop-stream", () => {
    try {
      if (liveStreams[socket.id]) {
        console.log(`❌ Stopping Stream: ${socket.id}`);
        delete liveStreams[socket.id];
        delete viewers[socket.id];

        io.emit("update-streams", Object.values(liveStreams));
      }
    } catch (error) {
      console.error("❌ Error in stop-stream:", error);
    }
  });

  // ✅ Viewer Joins a Stream
  socket.on("join-stream", (streamerId) => {
    try {
      if (!liveStreams[streamerId]) {
        console.warn(`⚠️ Stream ${streamerId} no longer exists.`);
        return;
      }

      console.log(`👀 Viewer ${socket.id} joined stream ${streamerId}`);
      socket.join(streamerId);

      if (!viewers[streamerId]) viewers[streamerId] = [];
      viewers[streamerId].push(socket.id);

      io.to(streamerId).emit("viewer-count", viewers[streamerId].length);
      socket.emit("joined-stream", { streamerId });
    } catch (error) {
      console.error("❌ Error in join-stream:", error);
    }
  });

  // ✅ Handle WebRTC Offer (Streamer to Viewer)
  socket.on("offer", (data) => {
    try {
      if (!data || !data.target || !data.sdp) {
        console.error("❌ Invalid WebRTC Offer received!");
        return;
      }

      console.log(`📡 Sending Offer from ${socket.id} to ${data.target}`);
      socket.to(data.target).emit("offer", { sdp: data.sdp, from: socket.id });
    } catch (error) {
      console.error("❌ Error in offer:", error);
    }
  });

  // ✅ Handle WebRTC Answer (Viewer to Streamer)
  socket.on("answer", (data) => {
    try {
      if (!data || !data.target || !data.sdp) {
        console.error("❌ Invalid WebRTC Answer received!");
        return;
      }

      console.log(`✅ Answer sent from ${socket.id} to ${data.target}`);
      socket.to(data.target).emit("answer", { sdp: data.sdp, from: socket.id });
    } catch (error) {
      console.error("❌ Error in answer:", error);
    }
  });

  // ✅ Handle ICE Candidate Exchange
  socket.on("ice-candidate", (data) => {
    try {
      if (!data || !data.candidate || !data.target) {
        console.error("❌ Invalid ICE Candidate received!");
        return;
      }

      console.log(`❄️ ICE Candidate from ${socket.id} to ${data.target}`);
      socket.to(data.target).emit("ice-candidate", { candidate: data.candidate });
    } catch (error) {
      console.error("❌ Error in ice-candidate:", error);
    }
  });

  // ✅ Handle User Disconnection (Auto Remove Stream)
  socket.on("disconnect", () => {
    try {
      if (liveStreams[socket.id]) {
        console.log(`❌ Streamer Disconnected: ${socket.id}`);
        delete liveStreams[socket.id];
        delete viewers[socket.id];

        io.emit("update-streams", Object.values(liveStreams));
      } else {
        console.log(`❌ Viewer Disconnected: ${socket.id}`);

        // ✅ Remove Viewer from Stream
        for (let streamerId in viewers) {
          viewers[streamerId] = viewers[streamerId].filter((id) => id !== socket.id);
          io.to(streamerId).emit("viewer-count", viewers[streamerId].length);
        }
      }
    } catch (error) {
      console.error("❌ Error in disconnect:", error);
    }
  });
});

// ✅ Handle Unexpected Errors (Prevents Crashes)
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Promise Rejection:", reason);
});

// ✅ Graceful Shutdown (CTRL+C)
process.on("SIGINT", () => {
  console.log("🛑 Server shutting down...");
  server.close(() => {
    console.log("✅ Server shut down successfully.");
    process.exit(0);
  });
});

// ✅ Start Server on Port 4000
const PORT = 4000;
server.listen(PORT, () => console.log(`📡 WebRTC Signaling Server running on port ${PORT}`));
