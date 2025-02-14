import React, { useState, useEffect } from "react";
import Chat from "./Chat";
import { db } from "../firebaseConfig";
import { collection, doc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import "../styles/global.css";

const TradingRoomsList = ({ user }) => {
  const [tradingRooms, setTradingRooms] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      rooms.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));
      setTradingRooms(rooms);
    });

    return () => unsubscribe();
  }, []);

  const joinRoom = async (roomId, isPrivate) => {
    if (!user) return alert("Please log in to join a room!");

    const roomRef = doc(db, "rooms", roomId);
    if (isPrivate) {
      await updateDoc(roomRef, { pendingUsers: arrayUnion(user.uid) });
    } else {
      await updateDoc(roomRef, { members: arrayUnion(user.uid) });
      setJoinedRooms([...joinedRooms, roomId]);
    }
  };

  return (
    <section className="trading-rooms">
      <h2>🏆 Active Trading Rooms</h2>
      <div className="rooms-grid">
        {tradingRooms.map((room, index) => (
          <div key={room.id} className="room-card">
            {room.thumbnail && <img src={room.thumbnail} alt="Room Thumbnail" className="room-thumbnail" />}
            <h3>#{index + 1} {room.roomName}</h3>
            <p>📌 {room.category}</p>
            <p>💬 {room.description}</p>
            <p>👥 Members: {room.members?.length || 0}</p>
            <button className="join-room-btn" onClick={() => joinRoom(room.id, room.isPrivate)}>
              {room.isPrivate ? "🔒 Request to Join" : "✅ Join Room"}
            </button>
            <Chat roomId={room.id} user={user} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default TradingRoomsList;
