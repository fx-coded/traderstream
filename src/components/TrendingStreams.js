import React, { useState, useEffect } from "react";
import "../styles/global.css";
import img1 from "./images/img1.png";
import img2 from "./images/img2.png";
import img3 from "./images/img3.png";
import img4 from "./images/img4.png";
import img5 from "./images/img5.png";
import img6 from "./images/img6.png";
import img7 from "./images/img7.png";
import img8 from "./images/img8.png";
import img9 from "./images/img9.png";
import img10 from "./images/img10.png";
import img11 from "./images/img11.png";
import img12 from "./images/img12.png";
import img13 from "./images/img13.png";
import img14 from "./images/img14.png";
import img15 from "./images/img15.png";
import img16 from "./images/img16.png";
import img17 from "./images/img17.png";
import img18 from "./images/img18.png";
import img19 from "./images/img19.png";
import img20 from "./images/img20.png";


// Mock Data: 10 Streams + 10 Chat Rooms
const placeholderTrending = [
  { id: 1, type: "stream", name: "Crypto Whale Watching", category: "Crypto Trading", viewers: 1200, thumbnail: img1 },
  { id: 2, type: "stream", name: "Scalping Gold Live", category: "Gold, Oil & Indices", viewers: 800, thumbnail: img2 },
  { id: 3, type: "stream", name: "BTC Going Parabolic 🚀", category: "Crypto Trading", viewers: 3000, thumbnail: img3 },
  { id: 4, type: "stream", name: "AI Trading Bots", category: "Tech & AI Trading", viewers: 900, thumbnail: img4 },
  { id: 5, type: "stream", name: "Forex Scalping Masterclass", category: "Forex Trading", viewers: 500, thumbnail: img5 },
  { id: 6, type: "stream", name: "Memecoin Hunt 🔥", category: "Meme Coin Degens", viewers: 1500, thumbnail: img6 },
  { id: 7, type: "stream", name: "Swing Trading Strategies", category: "Futures & Commodities", viewers: 1100, thumbnail: img7 },
  { id: 8, type: "stream", name: "Prop Firm Challenge 🏆", category: "Forex Trading", viewers: 700, thumbnail: img8 },
  { id: 9, type: "stream", name: "Ethereum ETF Incoming?", category: "Crypto Trading", viewers: 950, thumbnail: img9 },
  { id: 10, type: "stream", name: "Gold vs Bitcoin 2025", category: "Gold, Oil & Indices", viewers: 650, thumbnail: img10 },
  { id: 11, type: "chat", name: "🚀 Bitcoin 100x 🚀", category: "Crypto Trading", members: 250, profilePic: img11, message: "Bitcoin breakout incoming, sending it to the moon! 🌕" },
  { id: 12, type: "chat", name: "🔥 Meme Coins to 1000x", category: "Meme Coin Degens", members: 380, profilePic: img12, message: "This new meme coin is a goldmine! $PEPE to the moon! 🚀" },
  { id: 13, type: "chat", name: "Solana Degen Calls", category: "Crypto Trading", members: 200, profilePic: img13, message: "Solana $500 EOD?? Don’t fade the degen pump! 🤯" },
  { id: 14, type: "chat", name: "Gold Scalpers 🔥", category: "Gold, Oil & Indices", members: 180, profilePic: img14, message: "XAU/USD just broke resistance, get in before the next run! 🚀" },
  { id: 15, type: "chat", name: "Prop Firm Traders", category: "Forex Trading", members: 340, profilePic: img15, message: "Just passed my FTMO Challenge in 3 days! 🔥" },
  { id: 16, type: "chat", name: "🛑 Shorting the Market?", category: "Futures & Commodities", members: 120, profilePic: img16, message: "Bear market confirmed? Going full short on indices! 🐻" },
  { id: 17, type: "chat", name: "Best Trading Bots 🤖", category: "Tech & AI Trading", members: 280, profilePic: img17, message: "What’s the best trading bot for scalping right now? AI > Humans?" },
  { id: 18, type: "chat", name: "Forex vs Crypto Debate", category: "Forex Trading", members: 210, profilePic: img18, message: "Forex maxis and crypto maxis, fight it out here! 🥊" },
  { id: 19, type: "chat", name: "🔥 New Rug Pull Alert", category: "Meme Coin Degens", members: 390, profilePic: img19, message: "Another one bites the dust! Do Kwon style exit 😭" },
  { id: 20, type: "chat", name: "ETH Gas Fees Insane!", category: "Crypto Trading", members: 240, profilePic: img20, message: "Why is gas $300 to send a $5 NFT?! Wtf ETH!" },
];

const TrendingStreams = ({ setSelectedStreamer, realStreams, realChats }) => {
  const [trending, setTrending] = useState(placeholderTrending);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrending((prev) => {
        const shuffled = [...prev].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 10); // Show only 10 at a time
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ((realStreams && realStreams.length > 0) || (realChats && realChats.length > 0)) {
      setTrending([
        ...realStreams,
        ...realChats,
        ...placeholderTrending,
      ].slice(0, 10));
    }
  }, [realStreams, realChats]);

  return (
    <section className="trending-streams">
      <h2> Trending Streams & Chats</h2>

      <div className="streams-grid">
        {trending.map((item) => (
          <div key={item.id} className={`stream-card trending bounce ${item.type === "chat" ? "chat-card" : ""}`} onClick={() => setSelectedStreamer(item)}>
            {item.type === "chat" ? (
              <img src={item.profilePic} alt={item.name} className="chat-profile-pic" />
            ) : (
              <img src={item.thumbnail} alt={item.name} className="stream-thumbnail" />
            )}

            <div className="stream-info">
              <h3>{item.name}</h3>
              <p>{item.category}</p>
              <p>👥 {item.type === "chat" ? `${item.members} members` : `${item.viewers} viewers`}</p>
              {item.type === "chat" && <p className="chat-message">💬 {item.message}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingStreams;
