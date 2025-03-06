import React, { useState, useEffect, useMemo, useCallback, createContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { socket } from "./socketService"; // Import from separate file

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
import StreamerDashboard from "./components/StreamerDashboard/StreamDashboard";
import Viewer from "./components/Viewer";
import PropFirms from "./components/TopPropFirms";
import TopCryptoExchanges from "./components/TopCrypto";
import TopBrokers from "./components/TopBrokers";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationsComponent from "./components/NotificationsComponent";
import ConnectionStatus from "./components/ConnectionStatus"; // Add this new component

import "./App.css";

// Create context for global state
export const AppContext = createContext(null);

const App = () => {
  // State management
  const [activeTab, setActiveTab] = useState("live");
  const [tradingRooms, setTradingRooms] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(null);
  const [user, setUser] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  // Authentication monitoring with timeout
  useEffect(() => {
    setIsLoading(true);
    
    // Set a timeout to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Authentication timed out after 10 seconds");
        setIsLoading(false);
        setAuthTimedOut(true);
      }
    }, 10000); // 10 second timeout
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      setAuthTimedOut(false);
      clearTimeout(timeoutId); // Clear the timeout if auth responds
    }, (error) => {
      console.error("Authentication error:", error);
      setIsLoading(false);
      clearTimeout(timeoutId); // Clear the timeout if we get an error
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId); // Clean up the timeout
    };
  }, [isLoading]); // Added isLoading to the dependency array

  // Connect socket in useEffect with proper cleanup
  // IMPORTANT: This now depends on user state to provide authentication token
  useEffect(() => {
    const connectSocket = async () => {
      // Disconnect any existing connection
      if (socket.connected) {
        socket.disconnect();
      }
      
      // Set authentication token if user is logged in
      if (user) {
        try {
          const token = await user.getIdToken();
          socket.auth = { token };
          console.log("✅ Authentication token set for socket");
        } catch (error) {
          console.error("❌ Failed to get authentication token:", error);
          setConnectionError("Authentication error: Failed to get token");
          return () => {}; // Return empty cleanup if we can't get a token
        }
      } else {
        console.log("❓ No user logged in for socket authentication");
        // We won't connect the socket if no user is logged in
        // since the backend requires authentication
        setConnectionError("Authentication required: Please log in");
        return () => {};
      }
      
      // Only connect if we have a user with token
      if (user) {
        socket.connect();
      
        const onConnect = () => {
          console.log("✅ Socket connected");
          setSocketConnected(true);
          setConnectionError(null);
        };
        
        const onConnectError = (error) => {
          console.error("❌ Socket connection error:", error);
          setSocketConnected(false);
          setConnectionError(`Connection error: ${error.message}`);
        };
        
        const onDisconnect = (reason) => {
          console.log("❌ Socket disconnected:", reason);
          setSocketConnected(false);
        };
        
        // Setup event listeners
        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);
        socket.on("disconnect", onDisconnect);
        
        // Return cleanup function
        return () => {
          socket.off("connect", onConnect);
          socket.off("connect_error", onConnectError);
          socket.off("disconnect", onDisconnect);
          socket.disconnect();
        };
      }
      
      return () => {}; // Empty cleanup if no connection was established
    };
    
    // Start connection
    const setupCleanup = connectSocket();
    return () => {
      setupCleanup.then(cleanup => cleanup && cleanup());
    };
  }, [user]); // Now depends on user state

  // Socket event listeners in a separate useEffect
  useEffect(() => {
    if (socketConnected) {
      // Request initial streams data when connected
      socket.emit("get-streams");
      
      // Listen for live streams updates
      const handleStreamsUpdate = (streams) => {
        setLiveStreams(Array.isArray(streams) ? streams : []);
      };
      
      socket.on("update-streams", handleStreamsUpdate);
      
      // Cleanup listeners on unmount
      return () => {
        socket.off("update-streams", handleStreamsUpdate);
      };
    }
  }, [socketConnected]); // Only depend on socketConnected, not socket itself

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
      // Disconnect socket before logout
      if (socket.connected) {
        socket.disconnect();
        setSocketConnected(false);
      }
      
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
  }), [user, socketConnected, liveStreams, activeTab, logout, tradingRooms]);

  // Enhanced loading screen with timeout handling
  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p className="loading-message">Loading application...</p>
      </div>
    );
  }

  // Show auth error if timed out
  if (authTimedOut) {
    return (
      <div className="auth-error-container">
        <h2>Authentication Error</h2>
        <p>There was a problem connecting to the authentication service.</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppContext.Provider value={contextValue}>
        <Router>
          <ConnectionStatus socketConnected={socketConnected} connectionError={connectionError} />
          
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
                            <StreamerDashboard user={user} />
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
                          <Viewer user={user} />
                        </ErrorBoundary>
                      } 
                    />

                    <Route 
                      path="/notifications" 
                      element={
                        <ErrorBoundary>
                          <NotificationsComponent user={user} />
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