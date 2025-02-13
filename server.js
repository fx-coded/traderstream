require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
});

// 🔥 User Sign Up
app.post("/signup", async (req, res) => {
  const { email, password, username } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    res.status(201).json({ uid: userRecord.uid, message: "User created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🔥 User Login (Token Verification)
app.post("/login", async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    res.json({ uid: decodedToken.uid, message: "Login successful" });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
