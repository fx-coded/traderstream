import React from "react";
import { motion } from "framer-motion";
import Button from "./Button";
import "../styles/HeroSection.css";

const HeroSection = ({ setShowAuthModal }) => { // ✅ Receive `setShowAuthModal` as a prop
  return (
    <section className="hero-section">
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
        <Button
          className="hero-button join-now"
          onClick={() => setShowAuthModal("signup")} // ✅ Open Sign-Up Modal
        >
          Join Now
        </Button>
        <Button
          className="hero-button login"
          onClick={() => setShowAuthModal("login")} // ✅ Open Login Modal
        >
          Login
        </Button>
      </motion.div>
    </section>
  );
};

export default HeroSection;
