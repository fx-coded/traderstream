import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Chat from "./Chat"; // Import Chat Component
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
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

const TradingRoomsList = ({ filteredCategory }) => {
  const [tradingRooms, setTradingRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSetupRoom, setIsSetupRoom] = useState(false);
  const [tradeSetups, setTradeSetups] = useState([]);
  const [trade, setTrade] = useState({ asset: "", entry: "", stopLoss: "", takeProfit: "", analysis: "" });
  const [image, setImage] = useState(null);
  const [isSetupFormVisible, setIsSetupFormVisible] = useState(false);
  const [user, setUser] = useState(null);
  const storage = getStorage();
  const navigate = useNavigate();

  // Check user authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch trading rooms
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      rooms.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));
      setTradingRooms(rooms);
    });

    return () => unsubscribe();
  }, []);

  // Apply category filter
  useEffect(() => {
    setFilteredRooms(
      !filteredCategory
        ? tradingRooms
        : tradingRooms.filter((room) => room.category === filteredCategory)
    );
  }, [filteredCategory, tradingRooms]);

  // Handle image selection
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const joinRoom = async (roomId, type) => {
    if (!user) {
      alert("Please log in to join a room!");
      navigate("/login");
      return;
    }

    const roomRef = doc(db, "rooms", roomId);
    const roomSnapshot = await getDoc(roomRef);
    
    if (!roomSnapshot.exists()) {
      alert("Room not found!");
      return;
    }
    
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
      
      // Update URL to include room ID for direct access
      window.history.pushState({}, "", `/chatroom/${roomId}`);
      
      // Fetch trade setups for the selected room
      fetchTradeSetups(roomRef);
    }
  };

  // Separate function to fetch trade setups
  const fetchTradeSetups = (roomRef) => {
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setTradeSetups(doc.data().tradeSetups || []);
      }
    });
    return unsubscribe;
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    const storageRef = ref(storage, `tradeSetups/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const submitTradeSetup = async () => {
    if (!user) {
      alert("Please log in to submit a trade setup!");
      navigate("/login");
      return;
    }

    // Validate form
    if (!trade.asset || !trade.entry) {
      alert("Asset and Entry fields are required!");
      return;
    }

    try {
      let imageUrl = "";
      if (image) {
        imageUrl = await uploadImage(image);
      }

      const roomRef = doc(db, "rooms", selectedRoom);
      const setupData = {
        id: Date.now().toString(),
        userId: user.uid,
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
        likedBy: [],
        dislikedBy: [],
      };

      await updateDoc(roomRef, { tradeSetups: arrayUnion(setupData) });

      // Reset form
      setTrade({ asset: "", entry: "", stopLoss: "", takeProfit: "", analysis: "" });
      setImage(null);
      setIsSetupFormVisible(false);
      alert("Trade Setup Submitted ✅");
    } catch (error) {
      console.error("Error submitting trade setup:", error);
      alert("Error submitting trade setup. Please try again.");
    }
  };

  const handleVote = async (setupId, voteType) => {
    if (!user) {
      alert("Please log in to vote!");
      return;
    }

    try {
      const roomRef = doc(db, "rooms", selectedRoom);
      const roomSnapshot = await getDoc(roomRef);
      
      if (!roomSnapshot.exists()) {
        alert("Room not found!");
        return;
      }
      
      const roomData = roomSnapshot.data();
      const updatedSetups = roomData.tradeSetups.map(setup => {
        if (setup.id === setupId) {
          // Check if user already voted
          const hasLiked = setup.likedBy?.includes(user.uid);
          const hasDisliked = setup.dislikedBy?.includes(user.uid);
          
          if (voteType === 'like') {
            if (hasLiked) {
              // Remove like
              return {
                ...setup,
                likes: setup.likes - 1,
                likedBy: setup.likedBy.filter(id => id !== user.uid)
              };
            } else {
              // Add like and remove dislike if exists
              return {
                ...setup,
                likes: setup.likes + 1,
                dislikes: hasDisliked ? setup.dislikes - 1 : setup.dislikes,
                likedBy: [...(setup.likedBy || []), user.uid],
                dislikedBy: hasDisliked ? 
                  setup.dislikedBy.filter(id => id !== user.uid) : 
                  (setup.dislikedBy || [])
              };
            }
          } else {
            if (hasDisliked) {
              // Remove dislike
              return {
                ...setup,
                dislikes: setup.dislikes - 1,
                dislikedBy: setup.dislikedBy.filter(id => id !== user.uid)
              };
            } else {
              // Add dislike and remove like if exists
              return {
                ...setup,
                dislikes: setup.dislikes + 1,
                likes: hasLiked ? setup.likes - 1 : setup.likes,
                dislikedBy: [...(setup.dislikedBy || []), user.uid],
                likedBy: hasLiked ? 
                  setup.likedBy.filter(id => id !== user.uid) : 
                  (setup.likedBy || [])
              };
            }
          }
        }
        return setup;
      });

      await updateDoc(roomRef, { tradeSetups: updatedSetups });
    } catch (error) {
      console.error("Error updating vote:", error);
      alert("Error updating vote. Please try again.");
    }
  };

  const goBack = () => {
    setIsChatOpen(false);
    setIsSetupRoom(false);
    setSelectedRoom(null);
    // Reset URL
    window.history.pushState({}, "", "/");
  };

  // Render trade setup form
  const renderSetupForm = () => {
    if (!isSetupFormVisible) return null;
    
    return (
      <div className="setup-form-container">
        <h4>Add New Trade Setup</h4>
        <input 
          type="text" 
          placeholder="Asset (required)" 
          value={trade.asset} 
          onChange={(e) => setTrade({ ...trade, asset: e.target.value })} 
        />
        <input 
          type="text" 
          placeholder="Entry Price (required)" 
          value={trade.entry} 
          onChange={(e) => setTrade({ ...trade, entry: e.target.value })} 
        />
        <input 
          type="text" 
          placeholder="Stop Loss" 
          value={trade.stopLoss} 
          onChange={(e) => setTrade({ ...trade, stopLoss: e.target.value })} 
        />
        <input 
          type="text" 
          placeholder="Take Profit" 
          value={trade.takeProfit} 
          onChange={(e) => setTrade({ ...trade, takeProfit: e.target.value })} 
        />
        <textarea 
          placeholder="Analysis" 
          value={trade.analysis} 
          onChange={(e) => setTrade({ ...trade, analysis: e.target.value })}
        ></textarea>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange} 
        />
        <div className="form-buttons">
          <button onClick={() => setIsSetupFormVisible(false)}>Cancel</button>
          <button onClick={submitTradeSetup}>✅ Submit Setup</button>
        </div>
      </div>
    );
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
        <div className="chat-view">
          <button className="back-btn" onClick={goBack}>← Back to Rooms</button>
          <Chat
            roomId={selectedRoom}
            user={user}
            onExit={() => setIsChatOpen(false)}
          />
        </div>
      )}

      {isSetupRoom && selectedRoom && (
        <div className="setup-view">
          <button className="back-btn" onClick={goBack}>← Back to Rooms</button>
          <h3>🔥 Trade Setups</h3>
          <div className="setup-container">
            {tradeSetups.length === 0 ? (
              <p>No trade setups yet. Be the first to share your analysis!</p>
            ) : (
              tradeSetups.map((setup) => (
                <div key={setup.id} className="setup-card">
                  <div className="setup-header">
                    <h4>📊 {setup.asset}</h4>
                    <p className="setup-author">by {setup.user}</p>
                    <p className="setup-date">{setup.timestamp?.toDate().toLocaleString()}</p>
                  </div>
                  <p>🎯 Entry: {setup.entry} | 🚫 SL: {setup.stopLoss} | 🏁 TP: {setup.takeProfit}</p>
                  <p className="setup-analysis">📝 {setup.analysis}</p>
                  {setup.imageUrl && (
                    <img 
                      src={setup.imageUrl} 
                      alt="Trade Setup" 
                      className="setup-image" 
                      onClick={() => window.open(setup.imageUrl, '_blank')}
                    />
                  )}
                  <div className="setup-actions">
                    <button 
                      className={setup.likedBy?.includes(user?.uid) ? "active-vote" : ""}
                      onClick={() => handleVote(setup.id, 'like')}
                    >
                      👍 {setup.likes}
                    </button>
                    <button 
                      className={setup.dislikedBy?.includes(user?.uid) ? "active-vote" : ""}
                      onClick={() => handleVote(setup.id, 'dislike')}
                    >
                      👎 {setup.dislikes}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="add-setup-btn" onClick={() => setIsSetupFormVisible(!isSetupFormVisible)}>
            {isSetupFormVisible ? "✖" : "➕ Add Setup"}
          </button>

          {renderSetupForm()}
        </div>
      )}
    </div>
  );
};

export default TradingRoomsList;