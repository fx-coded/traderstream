import React, { useState, useEffect, useMemo, useCallback, createContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import socketService from "./socketService"; // Import improved socket service

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
import ConnectionStatus from "./components/ConnectionStatus";

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
  const [authError, setAuthError] = useState(null);

  // Authentication monitoring with enhanced timeout and error handling
  useEffect(() => {
    setIsLoading(true);
    
    // Set a timeout to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Authentication timed out after 10 seconds");
        setIsLoading(false);
        setAuthTimedOut(true);
        setAuthError(new Error("Authentication service is not responding"));
      }
    }, 10000);
    
    const unsubscribe = onAuthStateChanged(
      auth, 
      (currentUser) => {
        setUser(currentUser);
        setIsLoading(false);
        setAuthTimedOut(false);
        setAuthError(null);
        clearTimeout(timeoutId);
      }, 
      (error) => {
        console.error("Authentication error:", error);
        setIsLoading(false);
        setAuthTimedOut(true);
        setAuthError(error);
        clearTimeout(timeoutId);
      }
    );

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Socket connection and event handling
  useEffect(() => {
    const handleSocketConnection = async () => {
      if (user) {
        try {
          // Connect socket with user authentication
          await socketService.connectSocket();
          
          // Set up stream update listener
          const handleStreamsUpdate = (streams) => {
            setLiveStreams(Array.isArray(streams) ? streams : []);
          };
          
          socketService.socket.on("update-streams", handleStreamsUpdate);
          
          // Request initial streams
          socketService.socket.emit("get-streams");
          
          // Update connection states
          setSocketConnected(true);
          setConnectionError(null);
        } catch (error) {
          console.error("Socket connection failed:", error);
          setConnectionError(error.message);
          setSocketConnected(false);
        }
      } else {
        // Disconnect if no user
        socketService.disconnectSocket('No authenticated user');
        setSocketConnected(false);
      }
    };

    handleSocketConnection();

    // Cleanup listeners
    return () => {
      socketService.socket.off("update-streams");
      socketService.disconnectSocket('Component unmount');
    };
  }, [user]);

  // Handle room creation with user authentication check
  const handleRoomCreated = useCallback((newRoom) => {
    if (!user) {
      alert("❌ You must be logged in to create a trading room!");
      return false;
    }
    setTradingRooms(prevRooms => [...prevRooms, newRoom]);
    return true;
  }, [user]);

  // Enhanced logout method
  const logout = useCallback(async () => {
    try {
      // Disconnect socket
      socketService.disconnectSocket('User logout');
      
      // Sign out of Firebase
      await auth.signOut();
      
      // Reset application state
      setUser(null);
      setSocketConnected(false);
      setLiveStreams([]);
      setTradingRooms([]);
      setActiveTab("live");
      
      console.log("✅ User logged out successfully");
    } catch (error) {
      console.error("❌ Logout error:", error);
      alert("Failed to log out. Please try again.");
    }
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    socket: socketService.socket,
    socketConnected,
    liveStreams,
    activeTab,
    setActiveTab,
    logout,
    setShowAuthModal,
    tradingRooms,
    setTradingRooms
  }), [
    user, 
    socketConnected, 
    liveStreams, 
    activeTab, 
    logout, 
    tradingRooms
  ]);

  // Enhanced loading screen with timeout handling
  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p className="loading-message">Loading application...</p>
      </div>
    );
  }

  // Improved auth timeout error handling
  if (authTimedOut) {
    return (
      <div className="auth-error-container">
        <h2>Authentication Error</h2>
        <p>{authError?.message || 'Failed to connect to authentication service'}</p>
        <div className="error-actions">
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
          <button 
            className="support-button"
            onClick={() => {
              // Implement support contact or help mechanism
              window.open('mailto:support@yourapp.com', '_blank');
            }}
          >
            Contact Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppContext.Provider value={contextValue}>
        <Router>
          {!user ? (
            <HeroSection setShowAuthModal={setShowAuthModal} />
          ) : (
            <div className="app-container">
              {/* Connection status is now only shown for logged in users */}
              <ConnectionStatus 
                socketConnected={socketConnected} 
                connectionError={connectionError} 
              />
              
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
                            <TradingRoomsList 
                              tradingRooms={tradingRooms} 
                              user={user} 
                            />
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
                          <CreateTradingRoom 
                            onRoomCreated={handleRoomCreated} 
                            user={user} 
                          />
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
                    <Route 
                      path="/auth-action" 
                      element={<ErrorBoundary><AuthAction /></ErrorBoundary>} 
                    />

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