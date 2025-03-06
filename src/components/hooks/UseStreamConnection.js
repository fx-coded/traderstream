import { useState, useEffect, useCallback, useRef } from "react";
import { socket } from "../../socketService"; // Adjust the import path as needed

/**
 * Custom hook to manage socket connection for streaming
 * 
 * @param {string} streamId - The ID of the current stream
 * @returns {Object} - Connection state and methods
 */
export const useStreamConnection = (streamId) => {
  // State variables
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  
  // Use a ref to track streamId changes without triggering effect reruns
  const streamIdRef = useRef(streamId);
  
  // Update the ref when streamId changes
  useEffect(() => {
    streamIdRef.current = streamId;
  }, [streamId]);

  // Connect to socket when component mounts - ONCE ONLY
  useEffect(() => {
    // Only attempt connection if socket exists
    if (!socket) {
      setError("Socket service not available");
      return;
    }
    
    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }
    
    // Set up event handlers
    const onConnect = () => {
      console.log("Socket connected successfully");
      setIsConnected(true);
      setError(null);
    };
    
    const onDisconnect = (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      setIsConnected(false);
    };
    
    const onConnectError = (err) => {
      console.error("Socket connection failed:", err);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
    };
    
    // Register event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    
    // Set initial connected state
    setIsConnected(socket.connected);
    
    // Clean up on unmount
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []); // Empty dependency array - only run once
  
  // Handle viewer count updates - separate effect for streamId-dependent logic
  useEffect(() => {
    if (!socket || !streamId) return;
    
    const onViewerCountUpdate = (data) => {
      if (data.streamId === streamIdRef.current) {
        setViewerCount(data.count);
      }
    };
    
    socket.on("viewer-count", onViewerCountUpdate);
    
    return () => {
      socket.off("viewer-count", onViewerCountUpdate);
    };
  }, [streamId]);
  
  // Function to emit events to the socket server
  const emitEvent = useCallback((eventName, data) => {
    if (socket && isConnected) {
      socket.emit(eventName, data);
      return true;
    } else {
      console.warn(`Cannot emit ${eventName}: Socket not connected`);
      return false;
    }
  }, [isConnected]);
  
  return {
    socket,
    isConnected,
    error,
    viewerCount,
    emitEvent
  };
};

export default useStreamConnection;