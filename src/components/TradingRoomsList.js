import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Chat from "./Chat";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs
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
  const [loading, setLoading] = useState(true);
  const storage = getStorage();
  const navigate = useNavigate();
  const { roomId } = useParams();

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

  // Separate function to fetch trade setups - wrapped in useCallback to be reused
  const fetchTradeSetups = useCallback((roomRef) => {
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setTradeSetups(doc.data().tradeSetups || []);
      }
    });
    return unsubscribe;
  }, []);

  // Load room from URL parameter - wrapped in useCallback to prevent dependency issues
  const loadRoomFromUrl = useCallback(async (roomId) => {
    try {
      // First check if it's a chat ID
      const roomsQuery = query(
        collection(db, "rooms"),
        where("chatId", "==", roomId)
      );
      
      const roomSnapshot = await getDocs(roomsQuery);
      
      if (!roomSnapshot.empty) {
        const roomData = roomSnapshot.docs[0];
        setSelectedRoom(roomData.id);
        setIsChatOpen(true);
        return;
      }
      
      // If not found by chatId, try direct room ID
      const directRoomRef = doc(db, "rooms", roomId);
      const directRoomSnap = await getDoc(directRoomRef);
      
      if (directRoomSnap.exists()) {
        setSelectedRoom(roomId);
        setIsSetupRoom(true);
        // Fetch trade setups for the selected room
        fetchTradeSetups(directRoomRef);
      }
    } catch (error) {
      console.error("Error loading room from URL:", error);
    }
  }, [fetchTradeSetups]);

  // Handle direct URL access with proper dependency array
  useEffect(() => {
    if (roomId) {
      loadRoomFromUrl(roomId);
    }
  }, [roomId, user, loadRoomFromUrl]);

  // Fetch trading rooms
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      query(collection(db, "rooms"), orderBy("createdAt", "desc")), 
      (snapshot) => {
        const rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTradingRooms(rooms);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching rooms:", error);
        setLoading(false);
      }
    );

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

    // Check if room is private and user is not a member
    if (roomData.isPrivate && !roomData.members?.includes(user.uid)) {
      if (!roomData.pendingUsers?.includes(user.uid)) {
        // Add user to pending list
        await updateDoc(roomRef, { 
          pendingUsers: arrayUnion(user.uid) 
        });
        alert("This is a private room. Your request to join has been sent to the admin.");
      } else {
        alert("Your request to join this room is pending admin approval.");
      }
      return;
    }

    // Add user to members if not already a member
    if (!roomData.members?.includes(user.uid)) {
      await updateDoc(roomRef, { members: arrayUnion(user.uid) });
    }

    if (type === "chat") {
      setSelectedRoom(roomId);
      setIsChatOpen(true);
      setIsSetupRoom(false);
      
      // Update URL with chat ID for sharing
      if (roomData.chatId) {
        window.history.pushState({}, "", `/chat/${roomData.chatId}`);
      }
    } else if (type === "setup") {
      setSelectedRoom(roomId);
      setIsChatOpen(false);
      setIsSetupRoom(true);
      
      // Update URL to include room ID for direct access
      window.history.pushState({}, "", `/room/${roomId}`);
      
      // Fetch trade setups for the selected room
      fetchTradeSetups(roomRef);
    }
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
    window.history.pushState({}, "", "/rooms");
  };

  // Render trade setup form
  const renderSetupForm = () => {
    if (!isSetupFormVisible) return null;
    
    return (
      <div className="setup-form">
        <h3>Add New Trade Setup</h3>
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
          <button onClick={() => setIsSetupFormVisible(false)} className="cancel-btn">Cancel</button>
          <button onClick={submitTradeSetup} className="submit-btn">✅ Submit Setup</button>
        </div>
      </div>
    );
  };

  return (
    <div className={`trading-rooms-container ${isChatOpen || isSetupRoom ? 'room-active' : ''}`}>
      {!isChatOpen && !isSetupRoom && (
        <>
          <div className="trading-rooms-header">
            <div className="header-title">
              <span className="fire-icon">🔥</span> ACTIVE TRADING ROOMS
            </div>
            <button className="create-room-btn" onClick={() => navigate("/create-room")}>
              + Create Room
            </button>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>Loading rooms...</span>
            </div>
          ) : (
            <div className="rooms-container">
              {filteredRooms.map((room) => (
                <div key={room.id} className="room-item">
                  <div className="room-name">{room.roomName}</div>
                  <div className="room-info">
                    <div className="info-row">
                      <span className="info-label">
                        <span className="info-icon">👤</span>Created by:
                      </span>
                      <span className="info-value">{room.adminName || "Anonymous"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">
                        <span className="info-icon">👥</span>Members:
                      </span>
                      <span className="info-value">{room.members?.length || 0}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">
                        <span className="info-icon">{room.isPrivate ? "🔒" : "🔓"}</span>Privacy:
                      </span>
                      <span className={`info-value ${room.isPrivate ? "private" : "public"}`}>
                        {room.isPrivate ? "Private" : "Public"}
                      </span>
                    </div>
                  </div>
                  <div className="room-actions">
                    <button className="chat-btn" onClick={() => joinRoom(room.id, "chat")}>
                      💬 Chat
                    </button>
                    <button className="setups-btn" onClick={() => joinRoom(room.id, "setup")}>
                      📊 Setups
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {isChatOpen && selectedRoom && (
        <div className="chat-container">
          <button className="back-btn" onClick={goBack}>← Back to Rooms</button>
          <Chat
            roomId={selectedRoom}
            user={user}
            onExit={goBack}
          />
        </div>
      )}

      {isSetupRoom && selectedRoom && (
        <div className="setups-container">
          <button className="back-btn" onClick={goBack}>← Back to Rooms</button>
          <h2>Trade Setups</h2>
          
          {tradeSetups.length === 0 ? (
            <div className="no-setups">
              <p>No trade setups yet. Be the first to share your analysis!</p>
              <button onClick={() => setIsSetupFormVisible(true)} className="add-setup-btn">
                Add First Setup
              </button>
            </div>
          ) : (
            <div className="setups-list">
              {tradeSetups.map((setup) => (
                <div key={setup.id} className="setup-item">
                  <div className="setup-header">
                    <h3 className="setup-asset">📊 {setup.asset}</h3>
                    <p className="setup-author">by {setup.user}</p>
                  </div>
                  <div className="setup-levels">
                    {setup.entry && <div className="setup-level entry">🎯 Entry: {setup.entry}</div>}
                    {setup.stopLoss && <div className="setup-level stoploss">🛑 SL: {setup.stopLoss}</div>}
                    {setup.takeProfit && <div className="setup-level takeprofit">🏁 TP: {setup.takeProfit}</div>}
                  </div>
                  {setup.analysis && <p className="setup-analysis">{setup.analysis}</p>}
                  {setup.imageUrl && (
                    <img 
                      src={setup.imageUrl} 
                      alt="Trade chart" 
                      className="setup-image" 
                      onClick={() => window.open(setup.imageUrl, '_blank')}
                    />
                  )}
                  <div className="setup-footer">
                    <div className="setup-time">{setup.timestamp?.toDate 
                      ? setup.timestamp.toDate().toLocaleString() 
                      : new Date(setup.timestamp).toLocaleString()}</div>
                    <div className="vote-buttons">
                      <button 
                        className={`vote-btn ${setup.likedBy?.includes(user?.uid) ? 'active' : ''}`}
                        onClick={() => handleVote(setup.id, 'like')}
                      >
                        👍 {setup.likes || 0}
                      </button>
                      <button 
                        className={`vote-btn ${setup.dislikedBy?.includes(user?.uid) ? 'active' : ''}`}
                        onClick={() => handleVote(setup.id, 'dislike')}
                      >
                        👎 {setup.dislikes || 0}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button 
            className={`floating-add-btn ${isSetupFormVisible ? 'hidden' : ''}`}
            onClick={() => setIsSetupFormVisible(true)}
          >
            + Add Setup
          </button>
          
          {isSetupFormVisible && renderSetupForm()}
        </div>
      )}
    </div>
  );
};

export default TradingRoomsList;