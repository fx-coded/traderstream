import React, { useCallback } from "react";
import { motion } from "framer-motion";
import Button from "./Button";
import "../styles/HeroSection.css";

const HeroSection = ({ setShowAuthModal }) => {
  // Animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };
  
  const featureVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Memoize the click handlers to prevent recreation on each render
  const handleSignupClick = useCallback(() => {
    setShowAuthModal("signup");
  }, [setShowAuthModal]);

  const handleLoginClick = useCallback(() => {
    setShowAuthModal("login");
  }, [setShowAuthModal]);

  return (
    <section className="hero-section">
      {/* Mobile CTA buttons displayed at top for small screens */}
      <div className="mobile-cta-container">
        <Button 
          className="hero-button join-now"
          onClick={handleSignupClick}
        >
          Start Trading Now
        </Button>
        <Button 
          className="hero-button login"
          onClick={handleLoginClick}
        >
          Login
        </Button>
      </div>

      {/* Main Content with Staggered Animation */}
      <motion.div 
        className="hero-content"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.2
            }
          }
        }}
      >
        <motion.h1 
          className="hero-title"
          variants={titleVariants}
          transition={{ duration: 0.8 }}
        >
          <div className="title-row">
            <span className="hero-title-regular">THE</span>&nbsp;
            <span className="highlight">ULTIMATE</span>
          </div>
          <div className="title-row hero-title-regular">TRADING</div>
          <div className="title-row hero-title-regular">STREAMING PLATFORM</div>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          variants={featureVariants}
          transition={{ duration: 0.7 }}
        >
          Join live trading rooms, learn from experts, and connect with top traders worldwide
        </motion.p>

        <motion.div
          className="hero-features"
          variants={featureVariants}
          transition={{ duration: 0.6 }}
        >
          {/* You can add feature highlights here if needed */}
        </motion.div>

        {/* Desktop CTA buttons */}
        <div className="hero-buttons">
          <Button 
            className="hero-button join-now"
            onClick={handleSignupClick}
          >
            Start Trading Now
          </Button>
          <Button 
            className="hero-button login"
            onClick={handleLoginClick}
          >
            Login
          </Button>
        </div>
      </motion.div>
      
      {/* Background gradient effect */}
      <div className="hero-background">
        <div className="gradient-orb orb1"></div>
        <div className="gradient-orb orb2"></div>
      </div>
    </section>
  );
};

export default HeroSection;