import React, { useState } from "react";
import { db, storage } from "../firebaseConfig";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../styles/global.css";

const CreateTradingRoom = ({ user, onRoomCreated }) => {
  const [roomName, setRoomName] = useState("");
  const [category, setCategory] = useState("Forex Trading");
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 📌 Handle File Upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setError("❌ Only JPEG/PNG files are allowed!");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("❌ File size must be under 2MB!");
        return;
      }
      setThumbnail(file);
      setError("");
    }
  };

  // 📌 Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUploading(true); // ✅ Start loading state

    if (!user) {
      setError("❌ You need to log in to create a room!");
      setUploading(false);
      return;
    }
    if (!roomName.trim()) {
      setError("❌ Room name is required!");
      setUploading(false);
      return;
    }
    if (!description.trim()) {
      setError("❌ Description is required!");
      setUploading(false);
      return;
    }

    try {
      console.log("🚀 Checking if room name exists...");
      const roomQuery = query(collection(db, "rooms"), where("roomName", "==", roomName.trim()));
      const roomSnapshot = await getDocs(roomQuery);
      if (!roomSnapshot.empty) {
        setError("❌ A room with this name already exists!");
        setUploading(false);
        return;
      }

      let imageUrl = "";
      if (thumbnail) {
        console.log("📸 Uploading thumbnail...");
        const fileRef = ref(storage, `trading_rooms/${user.uid}_${Date.now()}`);
        const snapshot = await uploadBytes(fileRef, thumbnail);
        imageUrl = await getDownloadURL(snapshot.ref);
        console.log("✅ Thumbnail uploaded:", imageUrl);
      }

      console.log("📝 Creating room in Firestore...");
      const roomRef = await addDoc(collection(db, "rooms"), {
        roomName: roomName.trim(),
        category,
        isPrivate,
        description: description.trim(),
        thumbnail: imageUrl,
        adminId: user.uid,
        members: [user.uid],
        pendingUsers: [], // Stores pending user requests if private
        messages: [],
        createdAt: new Date(),
      });

      console.log("📢 Room created:", roomRef.id);

      if (isPrivate) {
        console.log("🔒 Setting up private room system message...");
        await updateDoc(doc(db, "rooms", roomRef.id), {
          messages: [
            {
              sender: "System",
              text: "🔔 This is a private room. Members must request access, and the admin will approve/reject requests.",
              timestamp: new Date(),
            },
          ],
        });
      }

      setSuccess("✅ Room created successfully!");
      setUploading(false);

      // 🔄 Trigger parent update without full page reload
      if (onRoomCreated) {
        onRoomCreated();
      }

      // Reset form
      setRoomName("");
      setCategory("Forex Trading");
      setIsPrivate(false);
      setDescription("");
      setThumbnail(null);

      // Auto-close form after success
      setTimeout(() => {
        setShowForm(false);
        setSuccess(""); // Clear success message
      }, 1000);
    } catch (err) {
      console.error("🔥 Error creating room:", err);
      setError("⚠️ Something went wrong. Try again.");
      setUploading(false);
    }
  };

  return (
    <div className="trading-room-container">
      {!showForm ? (
        <button className="create-room-button" onClick={() => setShowForm(true)}>
          ➕ Create Trading Room
        </button>
      ) : (
        <div className="trading-room-form">
          <h2>🚀 Create Trading Room</h2>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <form onSubmit={handleSubmit}>
            <label>Room Name:</label>
            <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} required />

            <label>Category:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Forex Trading</option>
              <option>Crypto Trading</option>
              <option>Futures & Commodities</option>
              <option>Meme Coin Degens</option>
              <option>Gold, Oil & Indices</option>
            </select>

            <label>Privacy:</label>
            <div className="privacy-options">
              <label>
                <input type="radio" name="privacy" checked={!isPrivate} onChange={() => setIsPrivate(false)} />
                🔓 Public (Anyone can join)
              </label>
              <label>
                <input type="radio" name="privacy" checked={isPrivate} onChange={() => setIsPrivate(true)} />
                🔒 Private (Admin approval required)
              </label>
            </div>

            <label>Upload Thumbnail (JPEG/PNG, max 2MB):</label>
            <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />

            <label>Description:</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>

            <button type="submit" disabled={uploading}>
              {uploading ? "⏳ Creating..." : "🚀 Create Room"}
            </button>
          </form>

          <button className="close-form-button" onClick={() => setShowForm(false)}>❌ Cancel</button>
        </div>
      )}
    </div>
  );
};

export default CreateTradingRoom;
