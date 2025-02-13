import React, { useState } from "react";
import "../styles/global.css";

const CreateTradingRoom = ({ onRoomCreated }) => {
  const [roomName, setRoomName] = useState("");
  const [category, setCategory] = useState("Forex Trading");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [billingCycle, setBillingCycle] = useState("weekly");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRoom = {
      id: Date.now(),
      roomName,
      category,
      isPaid,
      price: isPaid ? price : "Free",
      billingCycle: isPaid ? billingCycle : "N/A",
      description,
    };
    onRoomCreated(newRoom);
    setRoomName("");
    setPrice("");
    setDescription("");
  };

  return (
    <div className="trading-room-form">
      <h2>🎯 Create Your Trading Room</h2>
      <form onSubmit={handleSubmit}>
        <label>Room Name:</label>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          required
        />

        <label>Category:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Forex Trading">Forex Trading</option>
          <option value="Crypto Trading">Crypto Trading</option>
          <option value="Futures & Commodities">Futures & Commodities</option>
          <option value="Meme Coin Degens">Meme Coin Degens</option>
          <option value="Gold, Oil & Indices">Gold, Oil & Indices</option>
        </select>

        <label>
          <input
            type="checkbox"
            checked={isPaid}
            onChange={() => setIsPaid(!isPaid)}
          />
          Paid Room?
        </label>

        {isPaid && (
          <>
            <label>Price ($):</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />

            <label>Billing Cycle:</label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </>
        )}

        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit">🚀 Create Room</button>
      </form>
    </div>
  );
};

export default CreateTradingRoom;
