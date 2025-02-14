const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();
const db = admin.firestore();

// 📌 Start a Stream
router.post("/start", async (req, res) => {
  try {
    const { userId, title } = req.body;

    // Ensure user is authenticated
    const user = await admin.auth().getUser(userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Generate Stream Key
    const streamKey = `stream_${userId}_${Date.now()}`;

    // Save Stream Data in Firestore
    const streamRef = db.collection("streams").doc(streamKey);
    await streamRef.set({
      userId,
      title,
      streamKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      message: "✅ Stream started!",
      streamKey,
      rtmpUrl: process.env.RTMP_URL,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 Stop a Stream
router.post("/stop", async (req, res) => {
  try {
    const { userId, streamKey } = req.body;

    const streamRef = db.collection("streams").doc(streamKey);
    const stream = await streamRef.get();

    if (!stream.exists) return res.status(404).json({ error: "Stream not found" });

    await streamRef.delete();
    res.json({ message: "✅ Stream stopped!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 Get Active Streams
router.get("/active", async (req, res) => {
  try {
    const snapshot = await db.collection("streams").get();
    const streams = snapshot.docs.map(doc => doc.data());
    res.json(streams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
