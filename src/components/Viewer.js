import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import { 
  FaUserFriends, 
  FaVolumeUp, 
  FaVolumeMute, 
  FaExpand, 
  FaCompress, 
  FaExclamationTriangle,
  FaHeart,
  FaPaperPlane,
  FaSmile,
  FaTimes,
  FaStar
} from "react-icons/fa";
import "../styles/Viewer.css"; // Using existing CSS file to avoid the 'file not found' error

// WebRTC configuration with public STUN servers
const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ],
  iceCandidatePoolSize: 10
};

const Viewer = ({ 
  streamerId = "streamer", 
  serverUrl = "https://trading-backend-1059368735900.us-central1.run.app",
  streamerInfo = {
    name: "Della",
    title: "Live chat with fans",
    avatar: "/images/streamer-avatar.jpg"
  }
}) => {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const containerRef = useRef(null);
  const chatInputRef = useRef(null);
  
  // Component state
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [errorMessage, setErrorMessage] = useState(null);
  const [stats, setStats] = useState({
    resolution: "",
    bitrate: "",
    frameRate: ""
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamStartTime, setStreamStartTime] = useState(null);
  const [streamDuration, setStreamDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  
  // Chat functionality
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      username: "marianheart",
      message: "You have a weak internet",
      avatar: "/images/user1.jpg",
      timestamp: new Date().getTime() - 60000
    },
    {
      id: 2,
      username: "arman.uiux",
      message: "You're so beautiful 😍",
      avatar: "/images/user2.jpg",
      timestamp: new Date().getTime() - 30000
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [reactions, setReactions] = useState([]);

  // Format stream duration
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Collect and display stream statistics
  // FIXED: Removed duplicate startStatsCollection declaration
  const startStatsCollection = useCallback(() => {
    if (!peerRef.current) return;
    
    const statsInterval = setInterval(async () => {
      if (peerRef.current && peerRef.current.connectionState === "connected") {
        try {
          const stats = await peerRef.current.getStats();
          let videoBitrate = 0;
          let frameRate = 0;
          let resolution = '';
          
          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              // Calculate bitrate
              if (report.bytesReceived && report.timestamp && report.prevBytesReceived && report.prevTimestamp) {
                const bytesNow = report.bytesReceived;
                const timeNow = report.timestamp;
                
                if (report.prevTimestamp && report.prevBytesReceived) {
                  const bitrate = 8 * (bytesNow - report.prevBytesReceived) / 
                                  (timeNow - report.prevTimestamp);
                  videoBitrate = Math.floor(bitrate / 1000); // kbps
                }
                
                // Save current values for next calculation
                report.prevBytesReceived = bytesNow;
                report.prevTimestamp = timeNow;
              }
              
              // Get frame rate
              if (report.framesPerSecond) {
                frameRate = Math.round(report.framesPerSecond);
              }
            }
            
            // Get resolution
            if (report.type === 'track' && report.kind === 'video') {
              if (report.frameWidth && report.frameHeight) {
                resolution = `${report.frameWidth}x${report.frameHeight}`;
              }
            }
          });
          
          setStats({
            resolution,
            bitrate: videoBitrate ? `${videoBitrate} kbps` : '',
            frameRate: frameRate ? `${frameRate} fps` : ''
          });
        } catch (error) {
          console.error("Error getting stats:", error);
        }
      }
    }, 2000);
    
    return () => clearInterval(statsInterval);
  }, []);

  // Initialize WebRTC peer connection
  const initializePeerConnection = useCallback(() => {
    // Clean up any existing connection
    if (peerRef.current) {
      peerRef.current.close();
    }
    
    // Create new peer connection with config
    peerRef.current = new RTCPeerConnection(rtcConfig);
    
    // Set up ICE candidate handler
    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("📡 Generated ICE candidate for streamer");
        socketRef.current.emit("viewer-ice-candidate", {
          candidate: event.candidate,
          target: streamerId
        });
      }
    };
    
    // Connection state changes
    peerRef.current.onconnectionstatechange = () => {
      const state = peerRef.current.connectionState;
      console.log(`Connection state changed: ${state}`);
      
      switch (state) {
        case "connected":
          setConnectionStatus("connected");
          setErrorMessage(null);
          break;
        case "disconnected":
        case "failed":
          setConnectionStatus("error");
          setErrorMessage("Connection to stream lost. Attempting to reconnect...");
          // Attempt to reconnect after a short delay
          setTimeout(() => {
            if (socketRef.current && socketRef.current.connected) {
              initializePeerConnection();
              socketRef.current.emit("join-stream", streamerId);
            }
          }, 3000);
          break;
        case "closed":
          setConnectionStatus("disconnected");
          break;
        default:
          break;
      }
    };
    
    // Handle ice connection state
    peerRef.current.oniceconnectionstatechange = () => {
      console.log(`ICE connection state: ${peerRef.current.iceConnectionState}`);
    };
    
    // Handle tracks from streamer
    peerRef.current.ontrack = (event) => {
      console.log("🎥 Receiving video stream from streamer");
      
      if (videoRef.current && event.streams && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
        setConnectionStatus("streaming");
        
        // Start collecting stats
        startStatsCollection();
        
        // Set stream start time if not already set
        if (!streamStartTime) {
          setStreamStartTime(Date.now());
        }
      }
    };
  }, [streamerId, startStatsCollection, streamStartTime]);
  
  // Toggle audio mute
  const toggleMute = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const audioTracks = videoRef.current.srcObject.getAudioTracks();
      
      if (audioTracks.length > 0) {
        const newMuteState = !isMuted;
        audioTracks.forEach(track => {
          track.enabled = !newMuteState;
        });
        setIsMuted(newMuteState);
      }
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Stream duration timer
  useEffect(() => {
    let timer;
    if (connectionStatus === "streaming" && streamStartTime) {
      timer = setInterval(() => {
        const seconds = Math.floor((Date.now() - streamStartTime) / 1000);
        setStreamDuration(seconds);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [connectionStatus, streamStartTime]);

  // Show/hide controls on mouse movement
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (connectionStatus === "streaming") {
        setShowControls(false);
      }
    }, 3000);
    
    setControlsTimeout(timeout);
  };
  
  // Send a chat message
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const messageObj = {
      id: Date.now(),
      username: "you",
      message: newMessage,
      avatar: "/images/default-avatar.jpg",
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, messageObj]);
    if (socketRef.current) {
      socketRef.current.emit("chat-message", messageObj);
    }
    setNewMessage("");
    
    // Focus back on input
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };
  
  // Send a reaction
  const sendReaction = (type) => {
    const reactionObj = {
      id: Date.now(),
      type,
      position: {
        x: Math.random() * 80 + 10, // 10% to 90% of width
        y: Math.random() * 80 + 10  // 10% to 90% of height
      }
    };
    
    if (socketRef.current) {
      socketRef.current.emit("reaction", reactionObj);
    }
    setReactions(prev => [...prev, { ...reactionObj, expires: Date.now() + 3000 }]);
    setShowReactions(false);
  };
  
  // Handle message input keypress
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Handle socket connection and WebRTC
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(serverUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    // Capture video ref in a variable for the cleanup function
    const videoElement = videoRef.current;
    
    // Socket connection handlers
    socketRef.current.on("connect", () => {
      console.log("🔌 Connected to signaling server");
      setConnectionStatus("signaling");
      
      // Initialize peer connection
      initializePeerConnection();
      
      // Join stream as viewer
      socketRef.current.emit("join-stream", streamerId);
    });
    
    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnectionStatus("error");
      setErrorMessage("Could not connect to streaming server. Please try again later.");
    });
    
    socketRef.current.on("disconnect", (reason) => {
      console.log(`Disconnected from signaling server: ${reason}`);
      setConnectionStatus(reason === "io client disconnect" ? "disconnected" : "error");
      
      if (reason !== "io client disconnect") {
        setErrorMessage("Lost connection to streaming server. Attempting to reconnect...");
      }
    });
    
    // WebRTC signaling handlers
    socketRef.current.on("offer", async ({ sdp, from }) => {
      console.log("📡 Received offer from streamer");
      
      try {
        if (peerRef.current.signalingState !== "stable") {
          console.log("Cannot handle offer in state:", peerRef.current.signalingState);
          return;
        }
        
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        
        socketRef.current.emit("answer", { 
          sdp: peerRef.current.localDescription, 
          target: from 
        });
      } catch (error) {
        console.error("Error handling offer:", error);
        setErrorMessage("Failed to connect to stream. Please refresh and try again.");
        setConnectionStatus("error");
      }
    });
    
    socketRef.current.on("ice-candidate", ({ candidate }) => {
      console.log("📡 Received ICE candidate from streamer");
      
      if (peerRef.current && peerRef.current.remoteDescription) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(error => console.error("Error adding received ICE candidate:", error));
      } else {
        console.warn("Received ICE candidate but peer connection is not ready");
      }
    });
    
    socketRef.current.on("stream-ended", () => {
      console.log("Stream has ended");
      setConnectionStatus("ended");
      setErrorMessage("The stream has ended.");
    });
    
    socketRef.current.on("streamer-not-found", () => {
      console.log("Streamer not found");
      setConnectionStatus("error");
      setErrorMessage(`Stream with ID "${streamerId}" is not available.`);
    });
    
    socketRef.current.on("viewer-count", ({ count }) => {
      setViewerCount(count);
    });
    
    // Clean up reactions that have expired
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setReactions(prev => prev.filter(reaction => reaction.expires > now));
    }, 1000);

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      if (peerRef.current) {
        peerRef.current.close();
      }
      
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }
      
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      
      clearInterval(cleanupInterval);
    };
  }, [serverUrl, streamerId, initializePeerConnection, controlsTimeout]);

  return (
    <div 
      ref={containerRef} 
      className={`modern-live-stream ${isFullscreen ? 'fullscreen' : ''}`}
      onMouseMove={handleMouseMove}
    >
      <div className="stream-container">
        <div className={`video-container ${connectionStatus}`}>
          {/* Stream header */}
          <div className="stream-header">
            <div className="streamer-profile">
              <div className="avatar-container">
                <img 
                  src={streamerInfo.avatar || "/images/default-avatar.jpg"} 
                  alt={streamerInfo.name} 
                  className="streamer-avatar"
                  onError={(e) => {
                    e.target.src = "/images/default-avatar.jpg";
                  }}
                />
                <span className="live-badge">LIVE</span>
              </div>
              <div className="streamer-info">
                <h3>{streamerInfo.name}</h3>
                <p>{streamerInfo.title}</p>
              </div>
            </div>
            
            <button className="close-button">
              <FaTimes />
            </button>
          </div>
          
          {/* Status overlays */}
          {(connectionStatus === "connecting" || connectionStatus === "signaling") && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Connecting to stream...</p>
            </div>
          )}
          
          {connectionStatus === "error" && (
            <div className="error-overlay">
              <FaExclamationTriangle />
              <p>{errorMessage || "Connection error"}</p>
              <button onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          )}
          
          {/* Video element */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted={isMuted}
          />
          
          {/* Floating reactions */}
          <div className="reactions-container">
            {reactions.map(reaction => (
              <div 
                key={reaction.id}
                className={`floating-reaction ${reaction.type}`}
                style={{ 
                  left: `${reaction.position.x}%`, 
                  bottom: `${reaction.position.y}%` 
                }}
              >
                {reaction.type === 'heart' && <FaHeart />}
                {reaction.type === 'star' && <FaStar />}
                {reaction.type === 'fire' && '🔥'}
                {reaction.type === 'radioactive' && '☢️'}
              </div>
            ))}
          </div>
          
          {/* Video controls */}
          {showControls && (
            <div className="video-controls-bar">
              <button className="control-btn" onClick={toggleMute}>
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
              
              <div className="viewers-count">
                <FaUserFriends />
                <span>{viewerCount}</span>
              </div>
              
              <div className="duration">
                {formatDuration(streamDuration)}
              </div>
              
              <button className="control-btn" onClick={toggleFullscreen}>
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            </div>
          )}
        </div>
        
        {/* Chat section */}
        <div className="chat-container">
          <div className="chat-messages">
            {chatMessages.map(msg => (
              <div className="chat-message" key={msg.id}>
                <img 
                  src={msg.avatar || "/images/default-avatar.jpg"} 
                  alt={msg.username} 
                  className="message-avatar" 
                  onError={(e) => {
                    e.target.src = "/images/default-avatar.jpg";
                  }}
                />
                <div className="message-content">
                  <div className="message-header">
                    <span className="username">{msg.username}</span>
                  </div>
                  <p className="message-text">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="chat-input-container">
            <div className="reaction-picker">
              <button className="reaction-toggle" onClick={() => setShowReactions(!showReactions)}>
                <FaSmile />
              </button>
              
              {showReactions && (
                <div className="reaction-options">
                  <button onClick={() => sendReaction('heart')}>❤️</button>
                  <button onClick={() => sendReaction('star')}>⭐</button>
                  <button onClick={() => sendReaction('fire')}>🔥</button>
                  <button onClick={() => sendReaction('radioactive')}>☢️</button>
                </div>
              )}
            </div>
            
            <input
              type="text"
              ref={chatInputRef}
              placeholder="Comment..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            
            <button 
              className="send-button"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Viewer;