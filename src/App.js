import React, { useState, useEffect, useMemo, useCallback, createContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import io from "socket.io-client";

// Components
import HeroSection from "./components/HeroSection";
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
import PropFirms from "./components/TopPropFirms";
import TopCryptoExchanges from "./components/TopCrypto";
import TopBrokers from "./components/TopBrokers";
import LoadingSpinner from "./components/LoadingSpinner"; // Assuming you have this component
import ErrorBoundary from "./components/ErrorBoundary"; // Assuming you have this component

import "./App.css";

// Create context for global state
export const AppContext = createContext(null);

// Environment variables with fallbacks
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:4000";

const App = () => {
  // State management
  const [activeTab, setActiveTab] = useState("live");
  const [tradingRooms, setTradingRooms] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(null);
  const [user, setUser] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Initialize socket connection with error handling
  const socket = useMemo(() => {
    const socketInstance = io(SOCKET_URL, { 
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
    
    socketInstance.on("connect", () => {
      console.log("✅ Socket connected");
      setSocketConnected(true);
    });
    
    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setSocketConnected(false);
    });
    
    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setSocketConnected(false);
    });
    
    return socketInstance;
  }, []);

  // Authentication monitoring
  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    }, (error) => {
      console.error("Authentication error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      // Listen for live streams updates
      socket.on("update-streams", (streams) => {
        setLiveStreams(Array.isArray(streams) ? streams : []);
      });
      
      // Request initial streams data when connected
      if (socketConnected) {
        socket.emit("get-streams");
      }

      // Cleanup listeners on unmount
      return () => {
        socket.off("update-streams");
      };
    }
  }, [socket, socketConnected]);

  // Handle room creation - with useCallback to prevent unnecessary rerenders
  const handleRoomCreated = useCallback((newRoom) => {
    if (!user) {
      alert("❌ You must be logged in to create a trading room!");
      return false;
    }
    setTradingRooms(prevRooms => [...prevRooms, newRoom]);
    return true;
  }, [user]);

  // User logout - with useCallback
  const logout = useCallback(async () => {
    try {
      await auth.signOut();
      console.log("✅ User logged out");
      setUser(null);
    } catch (error) {
      console.error("❌ Logout error:", error);
      alert("Failed to log out. Please try again.");
    }
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    socket,
    socketConnected,
    liveStreams,
    activeTab,
    setActiveTab,
    logout,
    setShowAuthModal,
    tradingRooms,
    setTradingRooms
  }), [user, socket, socketConnected, liveStreams, activeTab, setActiveTab, logout, tradingRooms]);

  // Loading screen
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <AppContext.Provider value={contextValue}>
        <Router>
          {!user ? (
            <HeroSection setShowAuthModal={setShowAuthModal} />
          ) : (
            <div className="app-container">
              <Header 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                user={user} 
                logout={logout} 
              />

              <div className="main-layout">
                <div className="content-wrapper">
                  <Routes>
                    {/* Home Page */}
                    <Route
                      path="/"
                      element={
                        <ErrorBoundary>
                          {activeTab === "rooms" ? (
                            <TradingRoomsList tradingRooms={tradingRooms} user={user} />
                          ) : (
                            <>
                              <TrendingStreams />
                              <LiveStreams 
                                liveStreams={liveStreams} 
                                user={user} 
                                setShowAuthModal={setShowAuthModal} 
                                socketConnected={socketConnected}
                              />
                            </>
                          )}
                        </ErrorBoundary>
                      }
                    />

                    {/* Navigation Routes */}
                    <Route 
                      path="/live-streams" 
                      element={
                        <ErrorBoundary>
                          <LiveStreams 
                            liveStreams={liveStreams} 
                            user={user} 
                            setShowAuthModal={setShowAuthModal}
                            socketConnected={socketConnected}
                          />
                        </ErrorBoundary>
                      } 
                    />
                    <Route path="/chatrooms" element={<ErrorBoundary><TradingRoomsList /></ErrorBoundary>} />
                    <Route path="/brokers" element={<ErrorBoundary><TopBrokers /></ErrorBoundary>} />
                    <Route path="/prop-firms" element={<ErrorBoundary><PropFirms /></ErrorBoundary>} />
                    <Route path="/crypto-exchanges" element={<ErrorBoundary><TopCryptoExchanges /></ErrorBoundary>} />

                    {/* Trading Room Features */}
                    <Route 
                      path="/create-room" 
                      element={
                        <ErrorBoundary>
                          <CreateTradingRoom onRoomCreated={handleRoomCreated} user={user} />
                        </ErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/chat/:roomId" 
                      element={
                        <ErrorBoundary>
                          <Chat user={user} />
                        </ErrorBoundary>
                      } 
                    />

                    {/* Profile Route */}
                    <Route 
                      path="/profile/:streamerId" 
                      element={
                        <ErrorBoundary>
                          <StreamerProfile user={user} />
                        </ErrorBoundary>
                      } 
                    />

                    {/* Auth Action Route */}
                    <Route path="/auth-action" element={<ErrorBoundary><AuthAction /></ErrorBoundary>} />

                    {/* Protected Routes */}
                    <Route 
                      path="/go-live" 
                      element={
                        user ? (
                          <ErrorBoundary>
                            <StreamerDashboard user={user} socket={socket} />
                          </ErrorBoundary>
                        ) : (
                          <Navigate to="/" replace />
                        )
                      } 
                    />

                    {/* Viewer Route */}
                    <Route 
                      path="/viewer/:streamId" 
                      element={
                        <ErrorBoundary>
                          <Viewer socket={socket} user={user} />
                        </ErrorBoundary>
                      } 
                    />

                    {/* Catch-all Route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>

              <Footer />
            </div>
          )}

          {/* Authentication Modal */}
          {showAuthModal && (
            <AuthModal 
              type={showAuthModal} 
              setShowAuthModal={setShowAuthModal} 
              setUser={setUser} 
            />
          )}
        </Router>
      </AppContext.Provider>
    </ErrorBoundary>
  );
};

export default App;