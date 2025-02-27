import React, { useEffect, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "../styles/LiveStreams.css";

// Create socket connection outside component to prevent multiple connections
const SOCKET_SERVER = process.env.REACT_APP_SOCKET_URL || "http://localhost:4000";
const socket = io(SOCKET_SERVER, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Memoized stream card component for better performance
const StreamCard = memo(({ stream, viewerCount, onClick }) => (
  <div className="live-stream-card" onClick={onClick}>
    <div className="live-badge">LIVE</div>
    <img
      src={stream.thumbnail || "/assets/default-stream-thumbnail.jpg"}
      alt={`${stream.title} thumbnail`}
      className="live-stream-thumbnail"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "/assets/default-stream-thumbnail.jpg";
      }}
    />
    <div className="live-stream-info">
      <h3 className="live-stream-title">{stream.title}</h3>
      <p className="live-stream-category">
        <span className="category-icon">📌</span> {stream.category}
      </p>
      <p className="live-stream-viewers">
        <span className="viewers-icon">👀</span> {viewerCount} {viewerCount === 1 ? "viewer" : "viewers"}
      </p>
      <div className="streamer-info">
        {stream.profilePic && (
          <img 
            src={stream.profilePic} 
            alt="" 
            className="streamer-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/assets/default-avatar.jpg";
            }}
          />
        )}
        <p className="live-stream-user">
          <span className="host-icon">🎤</span> {stream.username}
        </p>
      </div>
      {stream.hashtags?.length > 0 && (
        <div className="live-stream-hashtags">
          {stream.hashtags.map((tag, index) => (
            <span key={index} className="hashtag">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  </div>
));

const LiveStreams = ({ liveStreams = [], user, setShowAuthModal }) => {
  const navigate = useNavigate();
  const [viewerCounts, setViewerCounts] = useState({});
  const [permissionError, setPermissionError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Handle socket connection status and events
  useEffect(() => {
    // Handle connection events
    socket.on("connect", () => {
      console.log("Connected to socket server");
      setSocketConnected(true);
    });
    
    socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
      setSocketConnected(false);
    });
    
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setSocketConnected(false);
    });

    // Handle viewer count updates
    socket.on("viewer-count", ({ streamerId, count }) => {
      setViewerCounts((prevCounts) => ({
        ...prevCounts,
        [streamerId]: count,
      }));
    });

    // Cleanup function
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("viewer-count");
    };
  }, []);

  // Request camera and microphone permissions
  const requestPermissions = useCallback(async () => {
    setIsLoading(true);
    setPermissionError(null);
    
    try {
      // First check if devices exist
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((device) => device.kind === "videoinput");
      const hasMic = devices.some((device) => device.kind === "audioinput");

      if (!hasCamera && !hasMic) {
        throw new Error("No camera or microphone detected on your device.");
      }

      if (!hasCamera) {
        throw new Error("No camera detected. A camera is required for streaming.");
      }

      if (!hasMic) {
        throw new Error("No microphone detected. A microphone is required for streaming.");
      }

      // Request permission to access devices
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });

      // Clean up by stopping all tracks
      stream.getTracks().forEach((track) => track.stop());
      
      return true;
    } catch (error) {
      console.error("Permission error:", error);
      
      // Handle different error types with user-friendly messages
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setPermissionError(
          "Camera or microphone access was denied. Please enable permissions in your browser settings."
        );
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setPermissionError(
          "Camera or microphone not found. Please check your device connections."
        );
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setPermissionError(
          "Your camera or microphone is already in use by another application."
        );
      } else if (error.name === "OverconstrainedError") {
        setPermissionError(
          "Your camera or microphone doesn't meet the required constraints."
        );
      } else if (error.name === "TypeError") {
        setPermissionError(
          "No media tracks of the requested type were found."
        );
      } else {
        setPermissionError(`${error.message || "Failed to access camera/microphone"}`);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle Go Live button click
  const handleGoLive = useCallback(async () => {
    // Check authentication
    if (!user) {
      if (typeof setShowAuthModal === "function") {
        setShowAuthModal("login");
      } else {
        // Fallback if modal function isn't available
        navigate("/login", { state: { returnTo: "/live-streams" } });
      }
      return;
    }

    // Check permissions
    const hasPermissions = await requestPermissions();
    if (hasPermissions) {
      navigate("/go-live");
    }
  }, [user, setShowAuthModal, requestPermissions, navigate]);

  // Handle stream click navigation
  const handleStreamClick = useCallback((streamId) => {
    navigate(`/viewer/${streamId}`);
  }, [navigate]);

  return (
    <div className="live-streams-container">
      <div className="live-streams-header">
        <h2 className="live-streams-title">
          <span className="title-icon">🎥</span> Live Streams
        </h2>
        
        <button 
          className={`go-live-btn ${isLoading ? "loading" : ""}`} 
          onClick={handleGoLive}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              <span>Checking...</span>
            </>
          ) : (
            <>
              <span className="btn-icon">🚀</span>
              <span>Go Live</span>
            </>
          )}
        </button>
      </div>

      {permissionError && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{permissionError}</span>
          <button 
            className="retry-btn" 
            onClick={() => {
              setPermissionError(null);
              requestPermissions();
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {!socketConnected && (
        <div className="connection-status warning">
          <span className="warning-icon">⚠️</span>
          <span>Live viewer counts may be inaccurate due to connection issues</span>
        </div>
      )}

      {liveStreams.length === 0 ? (
        <div className="no-streams-container">
          <p className="no-streams">No live streams available right now</p>
          <p className="start-stream-msg">Be the first to go live and start streaming!</p>
          <button className="start-stream-btn" onClick={handleGoLive}>
            Start Streaming
          </button>
        </div>
      ) : (
        <div className="live-stream-grid">
          {liveStreams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              viewerCount={viewerCounts[stream.id] ?? stream.viewers ?? 0}
              onClick={() => handleStreamClick(stream.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveStreams;