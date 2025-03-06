import io from "socket.io-client";

// Environment variables with fallbacks
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "https://trading-backend-1059368735900.us-central1.run.app";

// Create a single socket instance that can be imported throughout the app
export const socket = io(SOCKET_URL, { 
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  autoConnect: false // Don't connect automatically - we'll handle this in App.js
});

// Export a utility to help with debugging
export const getSocketStatus = () => {
  return {
    connected: socket.connected,
    id: socket.id,
    // Add any other useful socket state here
  };
};