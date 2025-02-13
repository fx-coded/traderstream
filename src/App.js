import React, { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/sideBar";
import LiveStreams from "./components/LiveStreams";
import TrendingStreams from "./components/TrendingStreams";
import StreamerProfile from "./components/StreamerProfile";
import CreateTradingRoom from "./components/CreateTradingRoom";
import TradingRoomsList from "./components/TradingRoomsList";
import Footer from "./components/Footer";
import AuthModal from "./Profile/AuthModal"; // Add modal component
import "./styles/global.css";

const App = () => {
  const [selectedStreamer, setSelectedStreamer] = useState(null);
  const [activeTab, setActiveTab] = useState("live");
  const [tradingRooms, setTradingRooms] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(null); // NEW: Authentication modal state
  const [user, setUser] = useState(null); // NEW: Store user data

  const handleRoomCreated = (newRoom) => {
    setTradingRooms([...tradingRooms, newRoom]);
  };

  const logout = () => {
    setUser(null); // Clear user data
  };

  return (
    <div className="app-container">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        setShowAuthModal={setShowAuthModal} // ✅ Pass down auth modal function
        user={user}
        logout={logout}
      />
      
      <div className="main-layout">
        <Sidebar />
        <div className="content-wrapper">
          {selectedStreamer ? (
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
          )}
        </div>
      </div>

      {/* ✅ Show Authentication Modal */}
      {showAuthModal && (
        <AuthModal type={showAuthModal} setShowAuthModal={setShowAuthModal} setUser={setUser} />
      )}
    </div>
  );
};

export default App;
