import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/sideBar";
import LiveStreams from "./components/LiveStreams";
import TrendingStreams from "./components/TrendingStreams";
import StreamerProfile from "./components/StreamerProfile";
import CreateTradingRoom from "./components/CreateTradingRoom";
import TradingRoomsList from "./components/TradingRoomsList";
import Footer from "./components/Footer";
import AuthModal from "./Profile/AuthModal"; 
import AuthAction from "./Profile/AuthAction"; // ✅ Import the new verification & reset password page
import "./styles/global.css";

const App = () => {
  const [selectedStreamer, setSelectedStreamer] = useState(null);
  const [activeTab, setActiveTab] = useState("live");
  const [tradingRooms, setTradingRooms] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(null);
  const [user, setUser] = useState(null);

  const handleRoomCreated = (newRoom) => {
    setTradingRooms([...tradingRooms, newRoom]);
  };

  const logout = () => {
    setUser(null);
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
          <Sidebar />
          <div className="content-wrapper">
            <Routes>
              <Route 
                path="/" 
                element={
                  selectedStreamer ? (
                    <StreamerProfile 
                      streamer={selectedStreamer} 
                      setSelectedStreamer={setSelectedStreamer} 
                    />
                  ) : activeTab === "rooms" ? (
                    <>
                      <CreateTradingRoom onRoomCreated={handleRoomCreated} />
                      <TradingRoomsList tradingRooms={tradingRooms} />
                    </>
                  ) : (
                    <>
                      <TrendingStreams setSelectedStreamer={setSelectedStreamer} />
                      <LiveStreams setSelectedStreamer={setSelectedStreamer} />
                      <Footer />
                    </>
                  )
                } 
              />
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
