import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import socketService from "../../socketService"; // Adjust the import path as needed

/**
 * Enum for socket connection states
 */
const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
};

/**
 * Custom hook to manage socket connection for streaming
 * 
 * @param {string} streamId - The ID of the current stream
 * @param {Object} [options] - Optional configuration
 * @param {number} [options.reconnectAttempts=3] - Number of reconnection attempts
 * @param {number} [options.reconnectDelay=1000] - Delay between reconnection attempts (ms)
 * @returns {Object} - Connection state and methods
 */
export const useStreamConnection = (streamId, options = {}) => {
  // Default options with user-provided overrides
  const {
    reconnectAttempts = 3,
    reconnectDelay = 1000
  } = options;

  // State variables with more comprehensive tracking
  const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);
  const [error, setError] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [reconnectionAttempt, setReconnectionAttempt] = useState(0);

  // Refs for tracking and preventing unnecessary re-renders
  const streamIdRef = useRef(streamId);
  const reconnectTimeoutRef = useRef(null);

  // Update streamId ref when it changes
  useEffect(() => {
    streamIdRef.current = streamId;
  }, [streamId]);

  // Comprehensive connection handler
  const handleConnection = useCallback(() => {
    // Reset connection state
    setConnectionState(ConnectionState.CONNECTING);
    setError(null);

    // Validate socket service
    if (!socketService.socket) {
      setConnectionState(ConnectionState.ERROR);
      setError("Socket service not available");
      return;
    }

    // Connection event handlers
    const onConnect = () => {
      console.log("Socket connected successfully");
      setConnectionState(ConnectionState.CONNECTED);
      setReconnectionAttempt(0);
      setError(null);

      // Emit stream join event if stream ID is available
      if (streamIdRef.current) {
        socketService.socket.emit('join-stream', { 
          streamId: streamIdRef.current 
        });
      }
    };

    const onDisconnect = (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      setConnectionState(ConnectionState.DISCONNECTED);

      // Attempt reconnection if not a deliberate disconnect
      if (reason !== 'io client disconnect' && 
          reconnectionAttempt < reconnectAttempts) {
        
        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Schedule reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectionAttempt(prev => prev + 1);
          handleConnection();
        }, reconnectDelay);
      }
    };

    const onConnectError = (err) => {
      console.error("Socket connection failed:", err);
      setConnectionState(ConnectionState.ERROR);
      setError(`Connection error: ${err.message}`);
    };

    // Register event listeners
    socketService.socket.on("connect", onConnect);
    socketService.socket.on("disconnect", onDisconnect);
    socketService.socket.on("connect_error", onConnectError);

    // Attempt connection
    try {
      socketService.socket.connect();
    } catch (connectionError) {
      console.error("Failed to connect socket:", connectionError);
      setConnectionState(ConnectionState.ERROR);
      setError(connectionError.message);
    }

    // Cleanup function
    return () => {
      // Clear any pending reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Remove event listeners
      socketService.socket.off("connect", onConnect);
      socketService.socket.off("disconnect", onDisconnect);
      socketService.socket.off("connect_error", onConnectError);
    };
  }, [reconnectAttempts, reconnectDelay, reconnectionAttempt]); // Added reconnectionAttempt to dependencies

  // Initial connection effect
  useEffect(() => {
    const cleanup = handleConnection();
    return cleanup;
  }, [handleConnection]); // Added handleConnection to dependencies

  // Viewer count update effect
  useEffect(() => {
    if (!socketService.socket || !streamId) return;

    const onViewerCountUpdate = (data) => {
      if (data.streamId === streamIdRef.current) {
        setViewerCount(data.count);
      }
    };

    socketService.socket.on("viewer-count", onViewerCountUpdate);

    return () => {
      socketService.socket.off("viewer-count", onViewerCountUpdate);
    };
  }, [streamId]);

  // Memoized emit event function
  const emitEvent = useCallback((eventName, data) => {
    if (socketService.socket && connectionState === ConnectionState.CONNECTED) {
      try {
        socketService.socket.emit(eventName, {
          ...data,
          streamId: streamIdRef.current
        });
        return true;
      } catch (emitError) {
        console.warn(`Failed to emit ${eventName}:`, emitError);
        return false;
      }
    } else {
      console.warn(`Cannot emit ${eventName}: Socket not connected`);
      return false;
    }
  }, [connectionState]);

  // Memoized return value to prevent unnecessary re-renders
  return useMemo(() => ({
    socket: socketService.socket,
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    error,
    viewerCount,
    emitEvent,
    reconnectionAttempt
  }), [connectionState, error, viewerCount, reconnectionAttempt, emitEvent]); // Added emitEvent to dependencies

};

export default useStreamConnection;