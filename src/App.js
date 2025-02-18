import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import io from "socket.io-client"; // ✅ Real-time updates
import HeroSection from "./components/HeroSection"; // ✅ Landing Page
import Header from "./components/Header";
import LiveStreams from "./components/LiveStreams";
import TrendingStreams from "./components/TrendingStreams";
import StreamerProfile from "./components/StreamerProfile";
import CreateTradingRoom from "./components/CreateTradingRoom";
import TradingRoomsList from "./components/TradingRoomsList";
import Chat from "./components/Chat";
import Footer from "./components/Footer";
import AuthModal from "./Profile/AuthModal";
import AuthAction from "./Profile/AuthAction";
import StreamerDashboard from "./components/StreamerDashboard";
import Viewer from "./components/Viewer";
import "./App.css";

const socket = io("http://localhost:4000"); // ✅ Connect to signaling server

const App = () => {
  const [activeTab, setActiveTab] = useState("live");
  const [tradingRooms, setTradingRooms] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(null);
  const [user, setUser] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]); // ✅ Tracks Active Live Streams

  // 🔥 Detect Firebase Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Listen for Live Streams Updates in Real-Time
  useEffect(() => {
    socket.on("update-streams", (streams) => {
      setLiveStreams(streams);
    });

    return () => {
      socket.off("update-streams");
    };
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

  // ✅ Handle "Go Live" Button Click
  const handleGoLiveClick = () => {
    if (!user) {
      setShowAuthModal("login"); // 🔐 Open login modal if user is not authenticated
    } else {
      window.location.href = "/go-live"; // 🚀 Redirect to Streamer Dashboard
    }
  };

  return (
    <Router>
      {!user ? (
        <HeroSection setShowAuthModal={setShowAuthModal} /> // ✅ Pass `setShowAuthModal`
      ) : (
        <div className="app-container">
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setShowAuthModal={setShowAuthModal}
            user={user}
            logout={logout}
          />
          
          <div className="main-layout">
            <div className="content-wrapper">
              <Routes>
                {/* ✅ Default Homepage */}
                <Route
                  path="/"
                  element={
                    activeTab === "rooms" ? (
                      <TradingRoomsList tradingRooms={tradingRooms} user={user} />
                    ) : (
                      <>
                        <TrendingStreams />
                        <LiveStreams
                          liveStreams={liveStreams}
                          user={user}
                          setShowAuthModal={setShowAuthModal}
                          handleGoLiveClick={handleGoLiveClick} // ✅ Pass Go-Live Handler
                        />
                        <Footer />
                      </>
                    )
                  }
                />

                {/* ✅ Route for Creating a Trading Room */}
                <Route path="/create-room" element={<CreateTradingRoom onRoomCreated={handleRoomCreated} user={user} />} />

                {/* ✅ Chat Room Route */}
                <Route path="/chat/:roomId" element={<Chat user={user} />} />

                {/* ✅ Full-Page Profile Route */}
                <Route path="/profile/:streamerId" element={<StreamerProfile user={user} />} />

                {/* ✅ Route for Email Verification & Password Reset */}
                <Route path="/auth-action" element={<AuthAction />} />

                {/* ✅ Protected Live Streaming Route */}
                <Route
                  path="/go-live"
                  element={user ? <StreamerDashboard user={user} /> : <Navigate to="/" />}
                />

                {/* ✅ Route for Viewers to Watch Streams */}
                <Route path="/viewer/:streamId" element={<Viewer />} />
              </Routes>
            </div>
          </div>

          <Footer />
        </div>
      )}

      {/* ✅ Authentication Modal */}
      {showAuthModal && <AuthModal type={showAuthModal} setShowAuthModal={setShowAuthModal} setUser={setUser} />}
    </Router>
  );
};

export default App;
