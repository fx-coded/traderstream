import React, { useState, useEffect } from "react";
import "../styles/TrendingStreams.css";
import img1 from "./images/img1.png";
import img2 from "./images/img2.png";
import img3 from "./images/img3.png";
import img11 from "./images/img11.png";
import img13 from "./images/img13.png";
import img14 from "./images/img14.png";
import trive from "./images/trive.jpg";

// Mock Data: Empty Streams (placeholder thumbnails for UI layout)
const placeholderStreams = [
  { id: 1, type: "stream", name: "My 2025 watchlist", category: "Crypto Trading", viewers: 0, thumbnail: img1, creator: "Money Speaks" },
  { id: 2, type: "stream", name: "My 2025 watchlist", category: "Gold, Oil & Indices", viewers: 0, thumbnail: img2, creator: "FxGuru" },
  { id: 3, type: "stream", name: "My 2025 watchlist", category: "Crypto Trading", viewers: 0, thumbnail: img3, creator: "Diamond Hands" },
];

// Mock Data: Chat Rooms/Discussions
const placeholderDiscussions = [
  { id: 11, type: "chat", name: "🚀 Bitcoin 100x 🚀", category: "Crypto Trading", members: 250, profilePic: img11, message: "Bitcoin breakout incoming, sending it to the moon! 🌕", creator: "Money Speaks" },
  { id: 13, type: "chat", name: "Solana Degen Calls", category: "Crypto Trading", members: 200, profilePic: img13, message: "Solana $500 EOD?? Don't fade the degen pump! 🤯", creator: "Diamond Hands" },
  { id: 14, type: "chat", name: "Gold Scalpers 🔥", category: "Gold, Oil & Indices", members: 180, profilePic: img14, message: "XAU/USD just broke resistance, get in before the next run! 🚀", creator: "FxGuru" },
];

const TrendingStreams = ({ setSelectedStreamer, realStreams, realChats }) => {
  // Always use placeholder streams for now (empty streams section as requested)
  const [trendingStreams, setTrendingStreams] = useState(placeholderStreams);
  // Use the already created chats data directly without slicing initially
  const [trendingDiscussions, setTrendingDiscussions] = useState([]);

  useEffect(() => {
    // Only display real chats if they exist, otherwise show placeholders
    if (realChats && realChats.length > 0) {
      // Only show real chats (created by users), limit to 3 for display
      setTrendingDiscussions(realChats.slice(0, 3));
    } else {
      // If no real chats, use first 3 placeholders
      setTrendingDiscussions(placeholderDiscussions.slice(0, 3));
    }
  }, [realChats]);

  return (
    <div className="trending-container">
      {/* Trive Advertisement Banner */}
      <div className="ad-banner">
        <div className="ad-label">Ad</div>
        <div className="ad-content">
          <div className="ad-text">
            <h2 className="ad-title">TRADE WITH TRIVE<br/>- THE PREMIER<br/>GLOBAL BROKER</h2>
            <p className="ad-subtext">Access 10,000+ markets with<br/>competitive spreads</p>
          </div>
          <div className="ad-media">
            <div className="ad-video-container">
              <iframe 
                className="youtube-video" 
                src="https://www.youtube.com/embed/P0E0rZCfo3A?autoplay=1&mute=1&loop=1&playlist=P0E0rZCfo3A" 
                title="Trive International" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="ad-info">
            <div className="ad-info-container">
              <div className="ad-info-icon">
                <img src={trive} alt="Trive icon" className="trive-icon" />
              </div>
              <div className="ad-info-text">
                <h3 className="ad-info-title">What is Trive Social?</h3>
                <p className="ad-info-description">
                  Trive Social is a trading platform that seamlessly integrates with technology. It simplifies the trading journey through copy trading, where users can follow and replicate the trades of top-performing traders. This feature is ideal for beginners learning the ropes and for experienced traders looking to diversify by leveraging expert strategies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trending Streams Section */}
      <section className="trending-section">
        <h3 className="section-title">TRENDING STREAMS</h3>
        
        <div className="content-grid">
          {trendingStreams.map(stream => (
            <div 
              key={stream.id} 
              className="content-card" 
              onClick={() => setSelectedStreamer(stream)}
            >
              <div className="card-thumbnail">
                <img 
                  src={stream.thumbnail} 
                  alt={stream.name} 
                  className="thumbnail-img"
                />
              </div>
              <div className="card-info">
                <p className="creator-name">{stream.creator}</p>
                <p className="stream-name">{stream.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Trending Discussions Section */}
      <section className="trending-section">
        <h3 className="section-title">TRENDING DISCUSSIONS</h3>
        
        <div className="content-grid">
          {trendingDiscussions.map(discussion => (
            <div 
              key={discussion.id} 
              className="content-card" 
              onClick={() => setSelectedStreamer(discussion)}
            >
              <div className="card-thumbnail">
                <img 
                  src={discussion.profilePic} 
                  alt={discussion.name} 
                  className="thumbnail-img"
                />
              </div>
              <div className="card-info">
                <p className="creator-name">{discussion.creator}</p>
                <p className="stream-name">{discussion.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TrendingStreams;