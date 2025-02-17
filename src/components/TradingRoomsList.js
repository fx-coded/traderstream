import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Chat from "./Chat"; // ✅ Import Chat Component
import { db } from "../firebaseConfig";
import {
  collection,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../styles/TrendingRoom.css";

const TradingRoomsList = ({ user, filteredCategory }) => {
  const [tradingRooms, setTradingRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSetupRoom, setIsSetupRoom] = useState(false);
  const [tradeSetups, setTradeSetups] = useState([]);
  const [trade, setTrade] = useState({ asset: "", entry: "", stopLoss: "", takeProfit: "", analysis: "" });
  const [image, setImage] = useState(null);
  const [isSetupFormVisible, setIsSetupFormVisible] = useState(false);
  const storage = getStorage();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      rooms.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));
      setTradingRooms(rooms);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setFilteredRooms(
      !filteredCategory
        ? tradingRooms
        : tradingRooms.filter((room) => room.category === filteredCategory)
    );
  }, [filteredCategory, tradingRooms]);

  const joinRoom = async (roomId, type) => {
    if (!user) return alert("Please log in to join a room!");

    const roomRef = doc(db, "rooms", roomId);
    const roomSnapshot = await getDoc(roomRef);
    const roomData = roomSnapshot.data();

    if (!roomData.members?.includes(user.uid)) {
      await updateDoc(roomRef, { members: arrayUnion(user.uid) });
    }

    if (type === "chat") {
      setSelectedRoom(roomId);
      setIsChatOpen(true);
      setIsSetupRoom(false);
    } else if (type === "setup") {
      setSelectedRoom(roomId);
      setIsChatOpen(false);
      setIsSetupRoom(true);
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          setTradeSetups(doc.data().tradeSetups || []);
        }
      });
      return () => unsubscribe();
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    const storageRef = ref(storage, `tradeSetups/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const submitTradeSetup = async () => {
    if (!user) return alert("Please log in to submit a trade setup!");

    let imageUrl = "";
    if (image) {
      imageUrl = await uploadImage(image);
    }

    const roomRef = doc(db, "rooms", selectedRoom);
    const setupData = {
      id: Date.now().toString(),
      user: user.displayName || user.email.split("@")[0],
      asset: trade.asset,
      entry: trade.entry,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      analysis: trade.analysis,
      imageUrl,
      timestamp: new Date(),
      likes: 0,
      dislikes: 0,
    };

    await updateDoc(roomRef, { tradeSetups: arrayUnion(setupData) });

    setTrade({ asset: "", entry: "", stopLoss: "", takeProfit: "", analysis: "" });
    setImage(null);
    setIsSetupFormVisible(false);
    alert("Trade Setup Submitted ✅");
  };

  return (
    <div className={isChatOpen || isSetupRoom ? "chat-room-container" : "trading-rooms-container"}>
      {!isChatOpen && !isSetupRoom && (
        <>
          <div className="trading-room-header">
            <h2>🔥 Active Trading Rooms</h2>
            <button className="create-room-btn" onClick={() => navigate("/create-room")}>
              ➕ Create Room
            </button>
          </div>

          <div className="rooms-grid">
            {filteredRooms.map((room) => (
              <div key={room.id} className="room-card">
                <h3 className="room-title">{room.roomName}</h3>
                <div className="room-meta">
                  <p>👤 Created by: <strong>{room.author || "Anonymous"}</strong></p>
                  <p>👥 Members: <strong>{room.members?.length || 0}</strong></p>
                  <p>🔒 Privacy: <strong>{room.isPublic ? "Public" : "Private"}</strong></p>
                </div>
                <div className="room-actions">
                  <button onClick={() => joinRoom(room.id, "chat")}>💬 Chat</button>
                  <button onClick={() => joinRoom(room.id, "setup")}>📊 Setups</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isChatOpen && selectedRoom && (
        <Chat
          roomId={selectedRoom}
          user={user}
          onExit={() => setIsChatOpen(false)}
        />
      )}

      {isSetupRoom && selectedRoom && (
        <>
          <h3>🔥 Trade Setups</h3>
          <div className="setup-container">
            {tradeSetups.length === 0 ? (
              <p>No trade setups yet.</p>
            ) : (
              tradeSetups.map((setup) => (
                <div key={setup.id} className="setup-card">
                  <h4>📊 {setup.asset}</h4>
                  <p>🎯 Entry: {setup.entry} | 🚫 SL: {setup.stopLoss} | 🏁 TP: {setup.takeProfit}</p>
                  <p>📝 {setup.analysis}</p>
                  {setup.imageUrl && <img src={setup.imageUrl} alt="Trade Setup" className="setup-image" />}
                  <div className="setup-actions">
                    <button>👍 {setup.likes}</button>
                    <button>👎 {setup.dislikes}</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="add-setup-btn" onClick={() => setIsSetupFormVisible(!isSetupFormVisible)}>
            ➕
          </button>

          {isSetupFormVisible && (
            <div className="setup-form-container">
              <input type="text" placeholder="Asset" value={trade.asset} onChange={(e) => setTrade({ ...trade, asset: e.target.value })} />
              <input type="text" placeholder="Entry Price" value={trade.entry} onChange={(e) => setTrade({ ...trade, entry: e.target.value })} />
              <input type="text" placeholder="Stop Loss" value={trade.stopLoss} onChange={(e) => setTrade({ ...trade, stopLoss: e.target.value })} />
              <input type="text" placeholder="Take Profit" value={trade.takeProfit} onChange={(e) => setTrade({ ...trade, takeProfit: e.target.value })} />
              <textarea placeholder="Analysis" value={trade.analysis} onChange={(e) => setTrade({ ...trade, analysis: e.target.value })}></textarea>
              <input type="file" onChange={(e) => setImage(e.target.files[0])} />
              <button onClick={submitTradeSetup}>✅ Submit Setup</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TradingRoomsList;
