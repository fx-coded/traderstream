import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Button from "./Button";
import "../styles/HeroSection.css";

const traderMessages = [
  "🚀 TP HIT!!",
  "📈 Market Pumping!",
  "🔥 FOMO buyers incoming!",
  "🤯 This is insane!",
  "💰 Let's print money!",
  "💎 Diamond hands!",
  "😂 Someone just got liquidated!",
  "🔮 Next target: $20K?",
];

const HeroSection = ({ setShowAuthModal }) => {
  const [chatBubbles, setChatBubbles] = useState([]);
  const [price, setPrice] = useState(9500); // Simulate a market move

  // 📈 Simulate price movement
  useEffect(() => {
    const interval = setInterval(() => {
      setPrice((prevPrice) => prevPrice + Math.random() * 50);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 💬 Generate random floating chat bubbles
  useEffect(() => {
    const chatInterval = setInterval(() => {
      const randomMessage =
        traderMessages[Math.floor(Math.random() * traderMessages.length)];
      setChatBubbles((prev) => [
        ...prev,
        { id: Date.now(), text: randomMessage, x: Math.random() * 80 + 10 },
      ]);

      // Remove old messages
      setTimeout(() => {
        setChatBubbles((prev) => prev.slice(1));
      }, 4000);
    }, 2000);

    return () => clearInterval(chatInterval);
  }, []);

  return (
    <section className="hero-section">
      {/* 📊 Floating Chat Bubbles */}
      <div className="floating-chat-container">
        {chatBubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            className="chat-bubble"
            style={{ left: `${bubble.x}%` }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -80 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3 }}
          >
            {bubble.text}
          </motion.div>
        ))}
      </div>

      {/* 📉 Animated Candlestick Chart */}
      <div className="chart-container">
        {[...Array(15)].map((_, index) => (
          <div key={index} className="candlestick" />
        ))}
      </div>

      {/* 🔥 Animated Profit Number */}
      <motion.div
        className="profit-display"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        +${price.toFixed(2)}
      </motion.div>

      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        The Ultimate Trading Streaming Platform
      </motion.h1>

      <motion.p
        className="hero-subtitle"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        Join live trading rooms, learn from experts, and connect with top traders.
      </motion.p>

      <motion.div
        className="hero-buttons"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Button className="hero-button join-now" onClick={() => setShowAuthModal("signup")}>
          Join Now
        </Button>
        <Button className="hero-button login" onClick={() => setShowAuthModal("login")}>
          Login
        </Button>
      </motion.div>
    </section>
  );
};

export default HeroSection;
