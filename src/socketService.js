import io from "socket.io-client";
import { getAuth } from "firebase/auth";

// Environment variables with fallbacks
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "https://trading-backend-1059368735900.us-central1.run.app";

// Create a socket instance - but don't connect yet
export const socket = io(SOCKET_URL, { 
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  autoConnect: false // Don't connect automatically
});

// Function to connect with authentication
export const connectSocket = async () => {
  try {
    const auth = getAuth();
    
    // Only try to authenticate if a user is logged in
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      
      // Set auth data
      socket.auth = { token };
    }
    
    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }
    
    return socket;
  } catch (error) {
    console.error("Socket authentication error:", error);
    return null;
  }
};

// Function to disconnect socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Export a utility to help with debugging
export const getSocketStatus = () => {
  return {
    connected: socket.connected,
    id: socket.id,
    // Add any other useful socket state here
  };
};