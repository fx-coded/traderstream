import React from "react";
import "../styles/global.css";

const TradingCategory = ({ category }) => {
  const streams = {
    forex: [
      { id: 1, title: "Live London Session Trading", trader: "TraderX", viewers: "4.5K", thumbnail: "https://via.placeholder.com/200" },
      { id: 2, title: "New York Open - Big Moves!", trader: "PipMaster", viewers: "3.2K", thumbnail: "https://via.placeholder.com/200" },
    ],
    futures: [
      { id: 3, title: "S&P 500 Futures Live Scalping", trader: "FuturesKing", viewers: "2.8K", thumbnail: "https://via.placeholder.com/200" },
      { id: 4, title: "Crude Oil Breakdown", trader: "OilTrader", viewers: "1.9K", thumbnail: "https://via.placeholder.com/200" },
    ],
    crypto: [
      { id: 5, title: "Bitcoin 10X Leverage Challenge", trader: "CryptoGuru", viewers: "6.9K", thumbnail: "https://via.placeholder.com/200" },
      { id: 6, title: "Ethereum Setup for 2025", trader: "BlockchainBro", viewers: "5.1K", thumbnail: "https://via.placeholder.com/200" },
    ],
    meme: [
      { id: 7, title: "Degen Trading Pepe Coins", trader: "MoonshotMax", viewers: "3.8K", thumbnail: "https://via.placeholder.com/200" },
      { id: 8, title: "Dogecoin Pump Party", trader: "DogeDaddy", viewers: "2.6K", thumbnail: "https://via.placeholder.com/200" },
    ],
    gold: [
      { id: 9, title: "Gold & Silver Analysis Live", trader: "GoldTrader", viewers: "4.2K", thumbnail: "https://via.placeholder.com/200" },
      { id: 10, title: "WTI Crude Price Action", trader: "EnergyExpert", viewers: "3.5K", thumbnail: "https://via.placeholder.com/200" },
    ],
  };

  return (
    <div className="category-streams">
      <h3>📊 {category.toUpperCase()} Trading Live</h3>
      <div className="category-grid">
        {streams[category]?.map((stream) => (
          <div key={stream.id} className="stream-card">
            <img src={stream.thumbnail} alt={stream.title} className="stream-thumbnail" />
            <h4>{stream.title}</h4>
            <p>👤 {stream.trader} | 👀 {stream.viewers} viewers</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradingCategory;
