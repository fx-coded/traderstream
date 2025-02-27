import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import logo from "./images/logo.png"
import "../styles/Header.css";

const Header = ({ user, setUser }) => {
  // State management
  const [showDropdown, setShowDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState("/default-profile.png");
  const [username, setUsername] = useState("Trader");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Refs
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Handle window resize to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
    setShowDropdown(false);
  }, [location.pathname]);

  // Fetch user profile in real-time
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfilePic(data.profilePic || "/default-profile.png");
          setUsername(data.username || "Trader");
          
          // Handle notifications
          if (data.notifications) {
            const unread = data.notifications.filter(n => !n.read).length;
            setUnreadCount(unread);
          }
        }
      },
      (error) => {
        console.error("Error fetching user data:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle clicks outside dropdown and menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close mobile menu when clicking outside
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !event.target.closest('.menu-toggle')
      ) {
        setMenuOpen(false);
      }

      // Close profile dropdown when clicking outside
      if (
        showDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    // Handle escape key to close dropdowns
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [menuOpen, showDropdown]);

  // Logout function using useCallback for better performance
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [navigate, setUser]);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
    setIsSearching(false);
  };

  // Focus search input when search icon is clicked
  const focusSearchInput = () => {
    setIsSearching(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // Navigation links configuration for easy maintenance
  const navLinks = [
    { path: "/live-streams", label: "Live Streams" },
    { path: "/chatrooms", label: "Chatrooms" },
    { path: "/brokers", label: "Brokers" },
    { path: "/prop-firms", label: "Prop Firms" },
    { path: "/crypto-exchanges", label: "Crypto Exchanges" }
  ];

  return (
    <header className="header">
      {/* Logo with image */}
      <div 
        className="logo" 
        onClick={() => navigate("/")}
        role="button"
        tabIndex={0}
        aria-label="Go to homepage"
      >
        <img 
          src={logo} 
          alt="TraderStream" 
          className="logo-image"
          onError={(e) => {
            e.target.onerror = null;
            // Fallback to text if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }} 
        />
        <span className="logo-text">TraderStream</span>
      </div>

      {/* Mobile Menu Toggle Button with animation */}
      <button 
        className={`menu-toggle ${menuOpen ? "active" : ""}`} 
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-label="Toggle navigation menu"
      >
        <span className="menu-icon"></span>
      </button>

      {/* Navigation Links */}
      <nav 
        ref={menuRef} 
        className={`nav-links ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen && window.innerWidth < 768}
      >
        {navLinks.map((link) => (
          <Link 
            key={link.path}
            to={link.path} 
            className={`nav-button ${location.pathname === link.path ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}

        {/* Mobile-only profile actions */}
        {user && menuOpen && (
          <div className="mobile-profile-actions">
            <Link 
              to={`/profile/${user.uid}`} 
              className="nav-button profile-link"
              onClick={() => setMenuOpen(false)}
            >
              <img src={profilePic} alt="" className="mini-profile-pic" />
              View Profile
            </Link>
            <button 
              className="nav-button logout-button" 
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Search bar with expanded functionality */}
      <div className={`search-container ${isSearching ? "active" : ""}`}>
        <form onSubmit={handleSearch} className="search-bar">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search traders, streams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => !searchQuery && setIsSearching(false)}
            aria-label="Search"
          />
          <button 
            type="submit" 
            className="search-btn"
            aria-label="Submit search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </form>
        {!isSearching && (
          <button 
            className="search-icon-mobile" 
            onClick={focusSearchInput}
            aria-label="Open search"
          >
            🔍
          </button>
        )}
      </div>

      {/* User Profile and Dropdown */}
      {user ? (
        <div className="user-profile" ref={dropdownRef}>
          {/* Notifications */}
          <div className="notifications-icon">
            <button 
              className="notification-btn" 
              onClick={() => navigate("/notifications")}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
          </div>

          {/* Profile Info */}
          <div 
            className="profile-info" 
            onClick={() => setShowDropdown(!showDropdown)}
            role="button"
            tabIndex={0}
            aria-expanded={showDropdown}
            aria-haspopup="true"
          >
            {!isMobile && (
              <img 
                src={profilePic} 
                alt="" 
                className="profile-pic"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-profile.png";
                }}
              />
            )}
            <span className="username">
              {username}
              <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
            </span>
          </div>

          {/* Dropdown Menu with enhanced options */}
          {showDropdown && (
            <div className="profile-dropdown">
              <Link 
                to={`/profile/${user.uid}`} 
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
              >
                <span className="dropdown-icon">👤</span>
                My Profile
              </Link>
              <Link 
                to="/settings" 
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
              >
                <span className="dropdown-icon">⚙️</span>
                Settings
              </Link>
              <Link 
                to="/my-streams" 
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
              >
                <span className="dropdown-icon">📺</span>
                My Streams
              </Link>
              <div className="dropdown-divider"></div>
              <button 
                onClick={handleLogout} 
                className="dropdown-item logout-button"
              >
                <span className="dropdown-icon">🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="auth-buttons">
          <Link to="/login" className="login-btn">Login</Link>
          <Link to="/register" className="register-btn">Sign Up</Link>
        </div>
      )}
    </header>
  );
};

export default Header;