import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "../styles/Header.css"; // Updated CSS file for styling

const Header = ({ setActiveTab, activeTab, setShowAuthModal, user, logout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState("/default-profile.png");
  const [username, setUsername] = useState("Trader");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch user profile in real-time
  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfilePic(data.profilePic || "/default-profile.png");
          setUsername(data.username || "Trader");
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

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
      {/* 🔹 Logo */}
      <div className="logo" onClick={() => navigate("/")}>
        TraderStream
      </div>

      {/* 🔹 Navigation */}
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

      {/* 🔹 Search Bar */}
      <div className="search-bar">
        <input type="text" placeholder="Search traders, streams..." />
        <button className="search-btn">🔍</button>
      </div>

      {/* 🔹 User Profile or Auth Options */}
      {user ? (
        <div className="user-profile" ref={dropdownRef}>
          <div className="profile-info" onClick={() => setShowDropdown(!showDropdown)}>
            <img src={profilePic} alt="User" className="profile-pic" />
            <span className="username">{username} ⬇</span>
          </div>

          {/* 🔻 Dropdown Menu */}
          {showDropdown && (
            <div className="profile-dropdown">
              <Link 
                to={`/profile/${user.uid}`} 
                className="view-profile" 
                onClick={() => setShowDropdown(false)}
              >
                View Profile
              </Link>
              <button onClick={logout} className="logout-button">
                Sign Out
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="auth-buttons">
          <button onClick={() => setShowAuthModal("login")} className="login-btn">Login</button>
          <button onClick={() => setShowAuthModal("signup")} className="signup-btn">Sign Up</button>
        </div>
      )}
    </header>
  );
};

export default Header;
