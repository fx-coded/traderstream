import React, { useCallback, memo } from "react";
import { motion } from "framer-motion";
import Button from "./Button";
import "../styles/HeroSection.css";

// Custom hook for retro animation glitch effect
const useRetroGlitch = () => {
  const [isGlitching, setIsGlitching] = React.useState(false);
  
  React.useEffect(() => {
    const randomGlitch = () => {
      const shouldGlitch = Math.random() > 0.7;
      if (shouldGlitch) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 150);
      }
      
      const nextGlitch = Math.random() * 5000 + 3000;
      setTimeout(randomGlitch, nextGlitch);
    };
    
    const timer = setTimeout(randomGlitch, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  return isGlitching;
};

const HeroSection = memo(({ setShowAuthModal }) => {
  // Use the retro glitch effect
  const isGlitching = useRetroGlitch();
  // Animation variants with improved timing and physics
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };
  
  const featureVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 80,
        damping: 15
      }
    }
  };

  // Memoized click handlers
  const handleSignupClick = useCallback(() => {
    setShowAuthModal("signup");
    // Track analytics
    try {
      if (window.analytics) {
        window.analytics.track('Signup Button Clicked', {
          location: 'hero section'
        });
      }
    } catch (e) {
      console.error('Analytics error:', e);
    }
  }, [setShowAuthModal]);

  const handleLoginClick = useCallback(() => {
    setShowAuthModal("login");
    // Track analytics
    try {
      if (window.analytics) {
        window.analytics.track('Login Button Clicked', {
          location: 'hero section'
        });
      }
    } catch (e) {
      console.error('Analytics error:', e);
    }
  }, [setShowAuthModal]);

  return (
    <section className="hero-section" aria-label="Trading platform introduction">
      {/* Mobile CTA buttons displayed at top for small screens */}
      <div className="mobile-cta-container" aria-hidden="true">
        <Button 
          className="hero-button join-now"
          onClick={handleSignupClick}
          data-testid="mobile-signup-button"
        >
          Start Trading Now
        </Button>
        <Button 
          className="hero-button login"
          onClick={handleLoginClick}
          data-testid="mobile-login-button"
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
              staggerChildren: 0.15,
              delayChildren: 0.1
            }
          }
        }}
      >
        <motion.h1 
          className={`hero-title ${isGlitching ? 'glitch-effect' : ''}`}
          variants={titleVariants}
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
        >
          Join live trading rooms, learn from experts, and connect with top traders worldwide
        </motion.p>

        <motion.div
          className="hero-features"
          variants={featureVariants}
        >
          <div className="feature-badge">
            <span className="feature-icon">🔥</span>
            Live Markets
          </div>
          <div className="feature-badge">
            <span className="feature-icon">📊</span>
            Real-time Data
          </div>
          <div className="feature-badge">
            <span className="feature-icon">👥</span>
            Community
          </div>
        </motion.div>

        {/* Desktop CTA buttons */}
        <motion.div 
          className="hero-buttons"
          variants={featureVariants}
        >
          <Button 
            className="hero-button join-now"
            onClick={handleSignupClick}
            data-testid="signup-button"
          >
            Start Trading Now
          </Button>
          <Button 
            className="hero-button login"
            onClick={handleLoginClick}
            data-testid="login-button"
          >
            Login
          </Button>
        </motion.div>
      </motion.div>
      
      {/* Background elements with improved performance */}
      <div className="hero-background" aria-hidden="true">
        <div className="gradient-orb orb1"></div>
        <div className="gradient-orb orb2"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Decorative elements */}
      <div className="decorative-elements" aria-hidden="true">
        <div className="trading-chart"></div>
        <div className="floating-elements">
          <div className="float-element ticker">BTC</div>
          <div className="float-element ticker">XAU</div>
          <div className="float-element ticker">NASDAQ</div>
        </div>
      </div>
    </section>
  );
});

// Add displayName for debugging purposes
HeroSection.displayName = "HeroSection";

export default HeroSection;