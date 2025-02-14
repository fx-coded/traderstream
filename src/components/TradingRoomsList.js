import React, { useState, useEffect } from "react";
import Chat from "./Chat";
import CreateTradingRoom from "./CreateTradingRoom";
import { db } from "../firebaseConfig";
import { collection, doc, updateDoc, arrayUnion, getDoc, onSnapshot } from "firebase/firestore";
import "../styles/global.css";

const TradingRoomsList = ({ user }) => {
  const [tradingRooms, setTradingRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      rooms.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));
      setTradingRooms(rooms);
    });

    return () => unsubscribe();
  }, []);

  const joinRoom = async (roomId) => {
    if (!user) return alert("Please log in to join a room!");

    const roomRef = doc(db, "rooms", roomId);
    const roomSnapshot = await getDoc(roomRef);
    const roomData = roomSnapshot.data();

    if (!roomData.members.includes(user.uid)) {
      await updateDoc(roomRef, { members: arrayUnion(user.uid) });
    }

    setSelectedRoom(roomId);
    setIsChatOpen(true);
  };

  return (
    <div className={isChatOpen ? "chat-room-container" : "trading-rooms-container"}>
      {!isChatOpen && <CreateTradingRoom user={user} onRoomCreated={() => window.location.reload()} />}

      {!isChatOpen && (
        <>
          <h2>🔥 Active Trading Rooms</h2>
          <div className="rooms-grid">
            {tradingRooms.map((room) => (
              <div key={room.id} className="room-card">
                {room.thumbnail && <img src={room.thumbnail} alt="Room Thumbnail" className="room-thumbnail" />}
                <h3>{room.roomName}</h3>
                <p>📌 {room.category}</p>
                <p>👥 Members: {room.members?.length || 0}</p>
                <p>{room.isPrivate ? "🔒 Private" : "🔓 Public"}</p>
                <button className="join-room-btn" onClick={() => joinRoom(room.id)}>
                  ✅ Join Room
                </button>
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
    </div>
  );
};

export default TradingRoomsList;
