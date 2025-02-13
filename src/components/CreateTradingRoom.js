import React, { useState } from "react";
import { db, storage } from "../firebaseConfig";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../styles/global.css";

const bannedWords = ["racistword1", "racistword2", "badword1", "badword2"];

const isValidRoomName = (name) => {
  if (!name.trim() || name.length < 3) return false;
  const words = name.toLowerCase().split(/\s+/);
  return !words.some((word) => bannedWords.includes(word)) && /[aeiouy]/gi.test(name);
};

const isValidDescription = (desc) => {
  if (!desc.trim() || desc.length < 5) return false;
  const words = desc.toLowerCase().split(/\s+/);
  return !words.some((word) => bannedWords.includes(word)) && /[aeiouy]/gi.test(desc);
};

const CreateTradingRoom = ({ user }) => {
  const [roomName, setRoomName] = useState("");
  const [category, setCategory] = useState("Forex Trading");
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("You need to log in to create a room!");
      return;
    }
    if (!isValidRoomName(roomName)) {
      setError("❌ Room name must be meaningful & contain real words!");
      return;
    }
    if (!isValidDescription(description)) {
      setError("❌ Description must be clear & at least 5 characters long!");
      return;
    }

    // 🔥 Check if the room name already exists
    const roomQuery = query(collection(db, "rooms"), where("roomName", "==", roomName));
    const roomSnapshot = await getDocs(roomQuery);
    if (!roomSnapshot.empty) {
      setError("❌ A room with this name already exists! Choose a different name.");
      return;
    }

    let imageUrl = "";
    if (thumbnail) {
      try {
        const fileRef = ref(storage, `trading_rooms/${user.uid}_${Date.now()}`);
        await uploadBytes(fileRef, thumbnail);
        imageUrl = await getDownloadURL(fileRef);
      } catch (uploadError) {
        setError("⚠️ Error uploading image. Try again.");
        return;
      }
    }

    const newRoom = {
      roomName,
      category,
      isPrivate,
      description,
      thumbnail: imageUrl,
      adminId: user.uid,
      members: [user.uid],
      pendingUsers: [],
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, "rooms"), newRoom);
      setSuccess("✅ Room created successfully!");
      setRoomName("");
      setDescription("");
      setThumbnail(null);
    } catch (dbError) {
      setError("⚠️ Error creating room. Try again.");
    }
  };

  return (
    <div className="trading-room-form">
      <h2>🚀 Create Your Trading Room</h2>
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
        <div>
          <label>
            <input type="radio" checked={!isPrivate} onChange={() => setIsPrivate(false)} /> Public
          </label>
          <label>
            <input type="radio" checked={isPrivate} onChange={() => setIsPrivate(true)} /> Private (Approval Required)
          </label>
        </div>

        <label>Upload Thumbnail (JPEG/PNG):</label>
        <input type="file" accept="image/png, image/jpeg" onChange={(e) => setThumbnail(e.target.files[0])} />

        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>

        <button type="submit">🚀 Create Room</button>
      </form>
    </div>
  );
};

export default CreateTradingRoom;
