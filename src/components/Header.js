import React, { useState, useEffect, useRef } from "react";
import "../styles/global.css";

const Header = ({ setActiveTab, activeTab, setShowAuthModal, user, logout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      <div className="logo">📈 TradeStream</div>
      <nav className="nav-links">
        <button 
          className={`nav-button ${activeTab === "live" ? "active" : ""}`} 
          onClick={() => setActiveTab("live")}
        >
          Live Streams
        </button>
        <button 
          className={`nav-button ${activeTab === "rooms" ? "active" : ""}`} 
          onClick={() => setActiveTab("rooms")}
        >
          Trading Rooms
        </button>
      </nav>
      <div className="search-bar">
        <input type="text" placeholder="Search traders, streams..." />
        <button>🔍</button>
      </div>

      {/* 👤 Show Profile if Logged In, Otherwise Show Login/Signup Buttons */}
      {user ? (
        <div className="user-profile" ref={dropdownRef}>
          <div className="profile-info" onClick={() => setShowDropdown(!showDropdown)}>
            <img src={user.profilePic} alt="User" className="profile-pic" />
            <span>{user.username} ⬇</span>
          </div>

          {/* 🎭 Profile Dropdown */}
          {showDropdown && (
            <div className="profile-dropdown">
              <p><strong>📅 Experience:</strong> {user.experience} years</p>
              <p><strong>📈 Instruments:</strong> {user.instruments}</p>
              <p><strong>📝 Bio:</strong> {user.bio}</p>
              <button onClick={logout} className="logout-button">🚪 Sign Out</button>
            </div>
          )}
        </div>
      ) : (
        <div className="auth-buttons">
          <button onClick={() => setShowAuthModal("login")}>Login</button>
          <button onClick={() => setShowAuthModal("signup")}>Sign Up</button>
        </div>
      )}
    </header>
  );
};

export default Header;
