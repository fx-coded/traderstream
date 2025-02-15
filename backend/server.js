const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const WebSocket = require("ws");
require("dotenv").config();

// ✅ Ensure Required Environment Variables are Loaded
const requiredEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_CLIENT_ID",
  "STORAGE_BUCKET",
  "FRONTEND_URL"
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️ Warning: Missing environment variable ${key}`);
  }
});

// 🔥 Firebase Admin Setup using .env
try {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"), // Fix: Prevent undefined error
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGE_BUCKET,
  });

  console.log("✅ Firebase Admin Initialized Successfully");
} catch (error) {
  console.error("❌ Error initializing Firebase Admin SDK:", error);
  process.exit(1); // Stop server if Firebase setup fails
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// 🚀 Express App Setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.FRONTEND_URL || "*" } });

app.use(cors());
app.use(express.json());

// 🔐 Middleware: Verify Firebase Auth Token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ✅ Test Route to Check API Status
app.get("/", (req, res) => {
  res.send("🔥 Trader Stream Backend is Running! 🚀");
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🔥 Server running on port ${PORT} 🚀`));