import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Header from "./components/Header";
import Sidebar from "./components/sideBar";
import LiveStreams from "./components/LiveStreams";
import TrendingStreams from "./components/TrendingStreams";
import StreamerProfile from "./components/StreamerProfile";
import CreateTradingRoom from "./components/CreateTradingRoom";
import TradingRoomsList from "./components/TradingRoomsList";
import Chat from "./components/Chat"; // ✅ Import Chat Component
import Footer from "./components/Footer";
import AuthModal from "./Profile/AuthModal";
import AuthAction from "./Profile/AuthAction"; // ✅ Email Verification & Password Reset Page
import "./styles/global.css";

const App = () => {
  const [activeTab, setActiveTab] = useState("live");
  const [tradingRooms, setTradingRooms] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(null);
  const [user, setUser] = useState(null);
  const [filteredCategory, setFilteredCategory] = useState(null); // ✅ Category Filtering State

  // 🔥 Detect Firebase Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("✅ User is logged in:", currentUser);
        setUser(currentUser);
      } else {
        console.log("❌ No user logged in");
        setUser(null);
      }
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // ✅ Handle New Trading Room Creation
  const handleRoomCreated = (newRoom) => {
    if (!user) {
      alert("❌ You must be logged in to create a trading room!");
      return;
    }
    setTradingRooms([...tradingRooms, newRoom]);
  };

  // ✅ User Logout
  const logout = () => {
    auth.signOut().then(() => {
      console.log("✅ User logged out");
      setUser(null);
    });
  };

  return (
    <Router>
      <div className="app-container">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          setShowAuthModal={setShowAuthModal} 
          user={user}
          logout={logout}
        />
        
        <div className="main-layout">
          <Sidebar setFilteredCategories={setFilteredCategory} activeTab={activeTab} /> {/* ✅ Pass Filter Function */}

          <div className="content-wrapper">
            <Routes>
              {/* ✅ Default Homepage (Shows Either Trading Rooms or Streams) */}
              <Route 
                path="/" 
                element={
                  activeTab === "rooms" ? (
                    <TradingRoomsList tradingRooms={tradingRooms} user={user} filteredCategory={filteredCategory} />
                  ) : (
                    <>
                      <TrendingStreams />
                      <LiveStreams setSelectedStreamer={() => {}} filteredCategory={filteredCategory} />
                      <Footer />
                    </>
                  )
                } 
              />

              {/* ✅ Dedicated Route for Creating a Trading Room */}
              <Route 
                path="/create-room" 
                element={<CreateTradingRoom onRoomCreated={handleRoomCreated} user={user} />}
              />

              {/* ✅ Chat Room Route (After Room Creation) */}
              <Route 
                path="/chat/:roomId" 
                element={<Chat user={user} />} 
              />

              {/* ✅ Full-Page Profile Route */}
              <Route path="/profile/:streamerId" element={<StreamerProfile user={user} />} />

              {/* ✅ Route for Email Verification & Password Reset */}
              <Route path="/auth-action" element={<AuthAction />} />
            </Routes>
          </div>
        </div>

        {/* ✅ Show Authentication Modal */}
        {showAuthModal && (
          <AuthModal type={showAuthModal} setShowAuthModal={setShowAuthModal} setUser={setUser} />
        )}
      </div>
    </Router>
  );
};

export default App;
