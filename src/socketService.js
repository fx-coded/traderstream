import io from "socket.io-client";
import { getAuth } from "firebase/auth";

// Environment variables with fallbacks
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "https://trading-backend-1059368735900.us-central1.run.app";

// Create a socket instance - but don't connect yet
export const socket = io(SOCKET_URL, { 
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  autoConnect: false, // Don't connect automatically
  path: '/socket.io/', // Explicitly set the socket.io path
  transports: ['websocket', 'polling'] // Try websocket first, fall back to polling
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
      console.log("✅ Authentication token set for socket");
    } else {
      console.log("❓ No user logged in for socket authentication");
    }
    
    // Add event listeners for connection status
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });
    
    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });
    
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
    auth: socket.auth ? "Set" : "Not set",
    url: SOCKET_URL,
    transport: socket.io?.engine?.transport?.name || "Not connected"
  };
};

// Add a function to check server status
export const checkServerStatus = async () => {
  try {
    const response = await fetch(`${SOCKET_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      return {
        status: "online",
        details: data
      };
    } else {
      return {
        status: "error",
        details: `Server returned ${response.status}`
      };
    }
  } catch (error) {
    return {
      status: "offline",
      details: error.message
    };
  }
};

export default {
  socket,
  connectSocket,
  disconnectSocket,
  getSocketStatus,
  checkServerStatus
};