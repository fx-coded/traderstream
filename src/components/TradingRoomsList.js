import React, { useState, useEffect } from "react";
import Chat from "./Chat";
import { db } from "../firebaseConfig";
import { collection, doc, updateDoc, arrayUnion, getDoc, onSnapshot } from "firebase/firestore";
import "../styles/global.css";

const TradingRoomsList = ({ user, filteredCategory }) => {
  const [tradingRooms, setTradingRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
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

  // Apply Category Filter
  useEffect(() => {
    if (!filteredCategory) {
      setFilteredRooms(tradingRooms);
    } else {
      setFilteredRooms(tradingRooms.filter((room) => room.category === filteredCategory));
    }
  }, [filteredCategory, tradingRooms]);

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

  // Pagination Logic
  const roomsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(Math.ceil(filteredRooms.length / roomsPerPage), 1);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * roomsPerPage,
    currentPage * roomsPerPage
  );

  return (
    <div className={isChatOpen ? "chat-room-container" : "trading-rooms-container"}>
      {!isChatOpen && (
        <>
          <h2>🔥 Active Trading Rooms</h2>
          {paginatedRooms.length > 0 ? (
            <div className="rooms-grid">
              {paginatedRooms.map((room) => (
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
          ) : (
            <p className="no-rooms">🚀 No trading rooms available for this category.</p>
          )}

          {/* Pagination */}
          {filteredRooms.length > roomsPerPage && (
            <div className="pagination">
              <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>◀ Prev</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>Next ▶</button>
            </div>
          )}
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
