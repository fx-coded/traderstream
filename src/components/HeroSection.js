import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Button from "./Button";
import "../styles/HeroSection.css";

const stockTickers = [
  "BTC/USD: $52,304.50 ▲",
  "ETH/USD: $3,478.30 ▲",
  "SPX500: 4,975.12 ▲",
  "TSLA: $202.89 ▼",
  "AAPL: $178.25 ▲",
  "SOL/USD: $110.45 ▲",
];

const HeroSection = ({ setShowAuthModal }) => {
  const [price, setPrice] = useState(9500);
  const [tickerIndex, setTickerIndex] = useState(0);

  // 📈 Simulate price movement
  useEffect(() => {
    const interval = setInterval(() => {
      setPrice((prevPrice) => prevPrice + Math.random() * 50);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 📊 Scrolling stock ticker
  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setTickerIndex((prevIndex) => (prevIndex + 1) % stockTickers.length);
    }, 2000);
    return () => clearInterval(tickerInterval);
  }, []);

  return (
    <section className="hero-section">
      {/* 📊 Scrolling Stock Ticker */}
      <div className="stock-ticker">
        <motion.div
          key={tickerIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 1 }}
        >
          {stockTickers[tickerIndex]}
        </motion.div>
      </div>

      {/* 🔥 Animated Profit Display */}
      <motion.div
        className="profit-display"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        +${price.toFixed(2)}
      </motion.div>

      {/* 🔥 Glowing Title Effect */}
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
