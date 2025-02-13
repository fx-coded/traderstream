import React from "react";
import Chat from "./Chat";
import "../styles/global.css";

const TradingRoomsList = ({ tradingRooms }) => {
  return (
    <section className="trading-rooms">
      <h2>🏆 Active Trading Rooms</h2>
      {tradingRooms.length === 0 ? (
        <p>No trading rooms available. Be the first to create one! 🚀</p>
      ) : (
        <div className="rooms-grid">
          {tradingRooms.map((room) => (
            <div key={room.id} className="room-card">
              <h3>{room.roomName}</h3>
              <p>📌 {room.category}</p>
              <p>💬 {room.description}</p>
              <p>
                {room.isPaid ? `💰 $${room.price} / ${room.billingCycle}` : "🆓 Free Room"}
              </p>
              <button className="join-room-btn">Join Room</button>
              <div className="room-content">
                <div className="stream-placeholder">🎥 Live Stream Here</div>
                <Chat />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default TradingRoomsList;
