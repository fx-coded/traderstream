require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const streamRoutes = require("./routes/streamRoutes");

const app = express();

// 📌 Middleware
app.use(cors());
app.use(express.json());

// 🔥 Firebase Admin Initialization
const serviceAccount = {
  type: process.env.FIREBASE_ADMIN_TYPE,
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// 📌 Routes
app.use("/api/streams", streamRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));

