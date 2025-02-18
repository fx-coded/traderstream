import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Ensure Firebase auth is imported
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "../styles/Header.css";

const Header = ({ user, setUser }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState("/default-profile.png");
  const [username, setUsername] = useState("Trader");
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
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

  // ✅ Close dropdown & menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !event.target.classList.contains("menu-toggle")
      ) {
        setMenuOpen(false);
      }

      if (
        showDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, showDropdown]);

  // ✅ Logout Function
  const handleLogout = async () => {
    try {
      await signOut(auth); // Clears Firebase authentication session
      setUser(null); // Reset user state
      navigate("/login"); // Redirect to login
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="header">
      {/* 🔹 Logo */}
      <div className="logo" onClick={() => navigate("/")}>
        TraderStream
      </div>

      {/* 🔹 Mobile Menu Toggle Button */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      {/* 🔹 Navigation */}
      <nav ref={menuRef} className={`nav-links ${menuOpen ? "open" : ""}`}>
        <Link to="/live-streams" className="nav-button" onClick={() => setMenuOpen(false)}>
          Live Streams
        </Link>
        <Link to="/chatrooms" className="nav-button" onClick={() => setMenuOpen(false)}>
          Chatrooms
        </Link>
        <Link to="/brokers" className="nav-button" onClick={() => setMenuOpen(false)}>
          Brokers
        </Link>
        <Link to="/prop-firms" className="nav-button" onClick={() => setMenuOpen(false)}>
          Prop Firms
        </Link>
        <Link to="/crypto-exchanges" className="nav-button" onClick={() => setMenuOpen(false)}>
          Crypto Exchanges
        </Link>

        {/* 🔹 Profile & Logout inside Mobile Menu */}
        {user && menuOpen && (
          <>
            <Link to={`/profile/${user.uid}`} className="nav-button" onClick={() => setMenuOpen(false)}>
              View Profile
            </Link>
            <button className="nav-button logout-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </nav>

      {/* 🔹 Desktop Search Bar (Hidden on Mobile) */}
      <div className="search-bar">
        <input type="text" placeholder="Search traders, streams..." />
        <button className="search-btn">🔍</button>
      </div>

      {/* 🔹 Desktop Profile & Logout (Hidden on Mobile) */}
      {user && (
        <div className="user-profile" ref={dropdownRef}>
          <div className="profile-info" onClick={() => setShowDropdown(!showDropdown)}>
            <img src={profilePic} alt="User" className="profile-pic" />
            <span className="username">{username} ⬇</span>
          </div>

          {/* 🔻 Dropdown Menu */}
          {showDropdown && (
            <div className="profile-dropdown">
              <Link to={`/profile/${user.uid}`} className="view-profile" onClick={() => setShowDropdown(false)}>
                View Profile
              </Link>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
