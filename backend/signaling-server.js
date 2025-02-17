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
    liveStreams[socket.id] = streamData;
    viewers[socket.id] = [];
    io.emit("update-streams", Object.values(liveStreams));
    console.log(`📡 Stream Started: ${streamData.username}`);
  });

  // ✅ Stop Streaming (Streamer Ends Live)
  socket.on("stop-stream", () => {
    delete liveStreams[socket.id];
    delete viewers[socket.id];
    io.emit("update-streams", Object.values(liveStreams));
    console.log(`❌ Stream Stopped: ${socket.id}`);
  });

  // ✅ Viewer Joins a Stream
  socket.on("join-stream", (streamerId) => {
    if (liveStreams[streamerId]) {
      console.log(`👀 Viewer ${socket.id} joined stream ${streamerId}`);
      socket.join(streamerId);

      // ✅ Track viewers
      if (!viewers[streamerId]) viewers[streamerId] = [];
      viewers[streamerId].push(socket.id);

      // ✅ Send updated viewer count
      io.to(streamerId).emit("viewer-count", viewers[streamerId].length);

      // ✅ Confirm viewer joined
      socket.emit("joined-stream", { streamerId });
    }
  });

  // ✅ Handle WebRTC Offer (Streamer to Viewer)
  socket.on("offer", (data) => {
    console.log(`📡 Sending Offer from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit("offer", { sdp: data.sdp, from: socket.id });
  });

  // ✅ Handle WebRTC Answer (Viewer to Streamer)
  socket.on("answer", (data) => {
    console.log(`✅ Answer sent from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit("answer", { sdp: data.sdp, from: socket.id });
  });

  // ✅ Handle ICE Candidate Exchange
  socket.on("ice-candidate", (data) => {
    console.log(`❄️ ICE Candidate from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit("ice-candidate", { candidate: data.candidate });
  });

  // ✅ Handle User Disconnection (Auto Remove Stream)
  socket.on("disconnect", () => {
    if (liveStreams[socket.id]) {
      delete liveStreams[socket.id];
      delete viewers[socket.id];
      io.emit("update-streams", Object.values(liveStreams));
      console.log(`❌ Streamer Disconnected: ${socket.id}`);
    } else {
      // ✅ Remove Viewer from Stream
      for (let streamerId in viewers) {
        viewers[streamerId] = viewers[streamerId].filter((id) => id !== socket.id);
        io.to(streamerId).emit("viewer-count", viewers[streamerId].length);
      }
      console.log(`❌ Viewer Disconnected: ${socket.id}`);
    }
  });
});

const PORT = 4000;
server.listen(PORT, () => console.log(`📡 WebRTC Signaling Server running on port ${PORT}`));
