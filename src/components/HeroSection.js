import React, { memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import useMarketData from "../services/useMarketData";
import "../styles/HeroSection.css";

// Memoized ticker component for better performance
const MarketTicker = memo(({ symbol, price, change, direction }) => {
  const isPositive = direction === "up";
  
  return (
    <div className={`ticker-item ${isPositive ? 'positive' : 'negative'}`}>
      <span className="ticker-symbol">{symbol}:</span>
      {price && (
        <span className="ticker-price">
          {symbol.includes('/USD') ? '$' : ''}{price.toFixed(2)}
        </span>
      )}
      <span className="ticker-change">
        {isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
      </span>
    </div>
  );
});

// Ticker skeleton loading component
const TickerSkeleton = () => (
  <div className="ticker-skeleton">
    <div className="ticker-symbol-skeleton"></div>
    <div className="ticker-change-skeleton"></div>
  </div>
);

const HeroSection = ({ setShowAuthModal }) => {
  // Use our custom hook for market data
  const { 
    visibleTickers, 
    profitData, 
    loading, 
    refreshData, 
    lastUpdated 
  } = useMarketData({
    refreshInterval: 60000, // Refresh market data every minute
    tickerRotationInterval: 5000, // Rotate visible tickers every 5 seconds
    initialTickerCount: 4, // Show 4 tickers on desktop
    enableAutoRefresh: true // Auto-refresh enabled
  });

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
      {/* Market Data Ticker */}
      <div className="market-ticker-container">
        <div className="market-ticker-label">
          LIVE MARKETS:
          {lastUpdated && (
            <span className="last-updated">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="market-ticker">
          <AnimatePresence mode="sync">
            {loading && visibleTickers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ticker-wrapper"
              >
                <TickerSkeleton />
                <TickerSkeleton />
              </motion.div>
            ) : (
              visibleTickers.map((ticker) => (
                <motion.div
                  key={ticker.symbol}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.5 }}
                  className="ticker-wrapper"
                >
                  <MarketTicker
                    symbol={ticker.symbol}
                    price={ticker.price}
                    change={ticker.change}
                    direction={ticker.direction}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
        
        {/* Manual refresh button */}
        <button 
          className="refresh-button" 
          onClick={refreshData}
          disabled={loading}
          aria-label="Refresh market data"
        >
          <span className={`refresh-icon ${loading ? 'loading' : ''}`}>↻</span>
        </button>
      </div>

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

      {/* Profit Display with Animation */}
      <motion.div 
        className="profit-display"
        animate={{ 
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="profit-label">DAILY PROFIT:</span>
        <span className="profit-value">
          +{profitData.amount.toFixed(2)} {profitData.currency}
        </span>
      </motion.div>

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
          <div className="feature-item">
            <span className="feature-icon">🔥</span>
            <span>Live Trading Signals</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>Real-time Analysis</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👨‍🏫</span>
            <span>Expert Mentorship</span>
          </div>
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