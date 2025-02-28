import React, { useState, useRef, useCallback, useEffect } from "react";
import { FaUserFriends, FaRegClock, FaShare, FaCopy } from "react-icons/fa";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import io from "socket.io-client";
import "../styles/Stream.css";
import { generateUniqueId } from "./utils/helpers"; // Utility for generating IDs

// Stream categories
const STREAM_CATEGORIES = [
  "Forex Trading",
  "Crypto Trading",
  "Futures & Commodities",
  "Stock Market",
  "Options Trading", 
  "Meme Coin Degens",
  "Gold, Oil & Indices",
  "Technical Analysis",
  "Day Trading",
  "Swing Trading"
];

const StreamerDashboard = ({ user }) => {
  // Refs
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Stream setup state
  const [streamTitle, setStreamTitle] = useState("");
  const [category, setCategory] = useState(STREAM_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [newHashtag, setNewHashtag] = useState("");
  const [showStreamSetup, setShowStreamSetup] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Stream status state
  const [isLoading, setIsLoading] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [streamStartTime, setStreamStartTime] = useState(null);
  const [streamId, setStreamId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  // Socket connection status
  const [socketConnected, setSocketConnected] = useState(false);
  const [isDeviceAllowed, setIsDeviceAllowed] = useState(true);

  // Check if device is desktop
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      setIsDeviceAllowed(!isMobile);
      
      if (isMobile) {
        setStreamError("Streaming is only available on desktop devices");
      }
    };
    
    checkDevice();
    window.addEventListener("resize", checkDevice);
    
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!isDeviceAllowed) return;

    // Create socket connection
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:4000", {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true
    });

    const socket = socketRef.current;

    // Connection event handlers
    const handleConnect = () => {
      console.log("✅ Connected to streaming server");
      setSocketConnected(true);
      setStreamError(null);
    };

    const handleDisconnect = (reason) => {
      console.log("❌ Disconnected from streaming server:", reason);
      setSocketConnected(false);
      
      if (!streamActive) {
        setStreamError("Not connected to streaming server. Please wait or refresh the page.");
      }
    };

    const handleConnectError = (err) => {
      console.error("Socket connection error:", err);
      setSocketConnected(false);
      setStreamError("Not connected to streaming server. Please wait or refresh the page.");
    };

    const handleViewerCount = ({ streamerId, count }) => {
      if (streamerId === streamId) {
        setViewerCount(count);
      }
    };

    const handleChatMessage = (message) => {
      if (message.streamId === streamId) {
        setChatMessages(prev => [...prev, message]);
        
        // Scroll to bottom of chat
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }
    };

    // Register event handlers
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("viewer-count", handleViewerCount);
    socket.on("chat-message", handleChatMessage);

    // Add WebRTC specific event listeners
    socket.on("answer", async (data) => {
      try {
        if (peerRef.current && data.sdp) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          console.log("Remote description set successfully");
        }
      } catch (error) {
        console.error("Error setting remote description:", error);
        setStreamError("Connection error. Please try restarting your stream.");
      }
    });

    socket.on("ice-candidate", async (data) => {
      try {
        if (peerRef.current && data.candidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    // Clean up on unmount
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("viewer-count", handleViewerCount);
      socket.off("chat-message", handleChatMessage);
      socket.off("answer");
      socket.off("ice-candidate");
      
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [isDeviceAllowed, streamId, streamActive]);

  // Stream duration timer
  useEffect(() => {
    let timer;
    if (streamActive && streamStartTime) {
      timer = setInterval(() => {
        const seconds = Math.floor((Date.now() - streamStartTime) / 1000);
        setStreamDuration(seconds);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [streamActive, streamStartTime]);

  // Format duration as HH:MM:SS
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? String(hours).padStart(2, "0") : null,
      String(minutes).padStart(2, "0"),
      String(secs).padStart(2, "0")
    ].filter(Boolean).join(":");
  };

  // Initialize WebRTC connection
  const initializeWebRTC = useCallback(async (stream, streamIdentifier) => {
    try {
      // Create peer connection
      peerRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" }
        ]
      });
      
      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerRef.current.addTrack(track, stream);
      });
      
      // Set up ICE candidate handling
      peerRef.current.onicecandidate = (event) => {
        if (event.candidate && socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("ice-candidate", { 
            candidate: event.candidate, 
            streamerId: streamIdentifier,
            target: "viewer" 
          });
        }
      };
      
      peerRef.current.oniceconnectionstatechange = () => {
        console.log("ICE State:", peerRef.current.iceConnectionState);
        
        if (peerRef.current.iceConnectionState === "disconnected" ||
            peerRef.current.iceConnectionState === "failed") {
          setStreamError("Connection issues detected. Viewers may be experiencing problems.");
        }
      };
      
      // Create and send offer
      const offer = await peerRef.current.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });
      
      await peerRef.current.setLocalDescription(offer);
      
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("offer", { 
          sdp: peerRef.current.localDescription, 
          streamerId: streamIdentifier,
          target: "viewer" 
        });
      } else {
        throw new Error("Socket disconnected while setting up WebRTC");
      }
      
      return true;
    } catch (error) {
      console.error("WebRTC setup error:", error);
      setStreamError("Failed to set up streaming connection. Please try again.");
      return false;
    }
  }, []);

  // Start streaming
  const startStream = useCallback(async () => {
    setStreamError(null);
    
    // Validation
    if (!streamTitle.trim()) {
      setStreamError("Please enter a stream title");
      return;
    }
    
    if (!acceptedTerms) {
      setStreamError("You must accept the Terms & Conditions to start streaming");
      return;
    }

    if (!isDeviceAllowed) {
      setStreamError("Streaming is only available on desktop devices");
      return;
    }

    if (!socketConnected || !socketRef.current || !socketRef.current.connected) {
      setStreamError("Not connected to streaming server. Please wait or refresh the page.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Requesting camera and microphone access...");
      const mediaConstraints = {
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      
      // Save stream reference for cleanup
      streamRef.current = stream;
      
      // Display preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Generate a unique stream ID
      const uniqueStreamId = generateUniqueId();
      setStreamId(uniqueStreamId);
      
      // Initialize WebRTC
      const rtcInitialized = await initializeWebRTC(stream, uniqueStreamId);
      
      if (!rtcInitialized) {
        throw new Error("Failed to initialize WebRTC connection");
      }
      
      // Prepare stream data
      const username = user?.displayName || user?.email?.split("@")[0] || "Anonymous";
      const newStream = {
        id: uniqueStreamId,
        title: streamTitle,
        category,
        description,
        hashtags,
        username,
        userId: user?.uid,
        photoURL: user?.photoURL || null,
        viewers: 0,
        startTime: Date.now()
      };
      
      // Save to Firestore
      await addDoc(collection(db, "streams"), {
        ...newStream,
        timestamp: serverTimestamp(),
        isActive: true
      });
      
      // Notify socket server
      socketRef.current.emit("start-stream", newStream);
      
      // Generate shareable URL
      const shareableUrl = `${window.location.origin}/viewer/${uniqueStreamId}`;
      setShareUrl(shareableUrl);
      
      // Update UI state
      setShowStreamSetup(false);
      setStreamActive(true);
      setStreamStartTime(Date.now());
      setChatMessages([]);
      
      console.log(`Stream started! Stream ID: ${uniqueStreamId}`);
    } catch (error) {
      console.error("Streaming error:", error);
      
      let errorMessage = "Failed to start streaming.";
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "Camera or microphone access denied. Please enable permissions in your browser settings.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "Camera or microphone not found. Please check your device connections.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage = "Your camera or microphone is already in use by another application.";
      }
      
      setStreamError(errorMessage);
      
      // Clean up any partial setup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    streamTitle, 
    category, 
    description, 
    hashtags, 
    acceptedTerms, 
    isDeviceAllowed, 
    socketConnected, 
    user, 
    initializeWebRTC
  ]);

  // Stop streaming
  const stopStream = useCallback(() => {
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clean up video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Close peer connection
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    
    // Notify server
    if (socketRef.current && socketRef.current.connected && streamId) {
      socketRef.current.emit("stop-stream", { streamerId: streamId });
    }
    
    // Reset state
    setShowStreamSetup(true);
    setStreamActive(false);
    setViewerCount(0);
    setStreamDuration(0);
    setStreamStartTime(null);
    setStreamId(null);
    setShareUrl("");
    setChatMessages([]);
    
    console.log("Stream stopped!");
  }, [streamId]);

  // Handle hashtag input
  const handleHashtagChange = (e) => {
    setNewHashtag(e.target.value);
  };

  // Add hashtag on Enter or comma
  const handleHashtagKeyDown = (event) => {
    if ((event.key === "Enter" || event.key === ",") && newHashtag.trim()) {
      event.preventDefault();
      const tag = newHashtag.trim().replace(/^#/, '');
      if (tag && !hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
        setNewHashtag("");
      }
    }
  };

  // Remove hashtag
  const removeHashtag = (index) => {
    setHashtags(hashtags.filter((_, i) => i !== index));
  };

  // Send chat message
  const sendChatMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !streamId || !socketRef.current) return;
    
    const message = {
      streamId: streamId,
      userId: user.uid,
      username: user.displayName || user.email?.split("@")[0] || "Anonymous",
      photoURL: user.photoURL || null,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };
    
    socketRef.current.emit("chat-message", message);
    setNewMessage("");
    
    // Add to local messages immediately
    setChatMessages(prev => [...prev, message]);
    
    // Scroll to bottom
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Copy stream URL to clipboard
  const copyStreamUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert("Stream URL copied to clipboard!");
        })
        .catch(err => {
          console.error("Failed to copy URL:", err);
        });
    }
  };

  // Share stream URL
  const shareStream = () => {
    if (!shareUrl) return;
    
    if (navigator.share) {
      navigator.share({
        title: streamTitle,
        text: `Check out my live trading stream: ${streamTitle}`,
        url: shareUrl
      }).catch(err => {
        console.error("Error sharing stream:", err);
      });
    } else {
      copyStreamUrl();
    }
  };

  // Confirm before leaving if stream is active
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (streamActive) {
        const message = "You are currently streaming. Leaving this page will end your stream.";
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [streamActive]);

  // If device is not allowed, show error message
  if (!isDeviceAllowed) {
    return (
      <div className="twitch-viewer-error">
        <h2>Device Not Supported</h2>
        <p>Streaming is only available on desktop devices.</p>
        <button onClick={() => window.history.back()} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="twitch-streamer-container">
      {showStreamSetup ? (
        // Stream Setup Screen
        <div className="stream-setup-container">
          <div className="setup-header">
            <h2>START YOUR LIVE STREAM</h2>
            <p>Set up your stream details below</p>
          </div>

          {streamError && (
            <div className="stream-error">
              <span className="error-icon">⚠️</span>
              <span>{streamError}</span>
              <button className="dismiss-error" onClick={() => setStreamError(null)}>✕</button>
            </div>
          )}

          <div className="setup-form">
            <div className="form-group">
              <label htmlFor="stream-title">Stream Title*</label>
              <input
                id="stream-title"
                type="text"
                placeholder="Enter an engaging title for your stream"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                maxLength={100}
              />
              <div className="char-count">{streamTitle.length}/100</div>
            </div>

            <div className="form-group">
              <label htmlFor="stream-category">Category*</label>
              <select 
                id="stream-category"
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                {STREAM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="stream-description">Description</label>
              <textarea
                id="stream-description"
                placeholder="Describe what your stream is about"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
              ></textarea>
              <div className="char-count">{description.length}/500</div>
            </div>

            <div className="form-group">
              <label htmlFor="stream-hashtags">Hashtags</label>
              <div className="hashtag-input-container">
                <input
                  id="stream-hashtags"
                  type="text"
                  placeholder="Type a hashtag and press Enter"
                  value={newHashtag}
                  onChange={handleHashtagChange}
                  onKeyDown={handleHashtagKeyDown}
                  maxLength={20}
                />
              </div>
              
              <div className="hashtag-list">
                {hashtags.length > 0 ? (
                  hashtags.map((tag, index) => (
                    <span key={index} className="hashtag">
                      #{tag}
                      <button 
                        type="button" 
                        className="remove-hashtag" 
                        onClick={() => removeHashtag(index)}
                      >
                        ✕
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="hashtag-placeholder">
                    Add hashtags to help viewers find your stream
                  </span>
                )}
              </div>
            </div>

            <div className="terms-container">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={acceptedTerms}
                onChange={() => setAcceptedTerms(!acceptedTerms)}
              />
              <label htmlFor="terms-checkbox">
                I accept the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>
              </label>
            </div>

            <button 
              className={`stream-button ${acceptedTerms && socketConnected ? "enabled-btn" : "disabled-btn"}`}
              onClick={startStream}
              disabled={isLoading || !acceptedTerms || !socketConnected}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>Preparing Stream...</span>
                </>
              ) : (
                <>🎥 Start Streaming</>
              )}
            </button>
            
            {!socketConnected && !streamError && (
              <div className="connection-status">
                <p className="connection-message">Waiting for server connection...</p>
                <button className="retry-connection-btn" onClick={() => window.location.reload()}>
                  Retry Connection
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Active Stream Screen (Twitch-style)
        <div className="twitch-stream-container">
          <div className="stream-header">
            <div className="streamer-info">
              <img 
                src={user?.photoURL || "https://via.placeholder.com/40"} 
                alt={user?.displayName} 
                className="streamer-avatar" 
              />
              <div className="streamer-details">
                <h2 className="stream-title">{streamTitle}</h2>
                <p className="streamer-name">{user?.displayName || user?.email?.split('@')[0] || "Anonymous"}</p>
              </div>
            </div>
            <div className="stream-stats">
              <div className="stat-item">
                <FaUserFriends className="stat-icon" />
                <span>{viewerCount}</span>
              </div>
              <div className="stat-item">
                <FaRegClock className="stat-icon" />
                <span>{formatDuration(streamDuration)}</span>
              </div>
              <div className="stream-actions">
                <button className="share-button" onClick={shareStream}>
                  <FaShare /> Share
                </button>
                <button className="copy-button" onClick={copyStreamUrl}>
                  <FaCopy /> Copy URL
                </button>
                <button className="stop-stream-button" onClick={stopStream}>
                  Stop Stream
                </button>
              </div>
            </div>
          </div>

          <div className="stream-content">
            {/* Video Section */}
            <div className="video-section">
              <div className="video-container">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="stream-video" 
                />
                <div className="video-overlay">
                  <div className="stream-category">
                    <span className="category-tag">{category}</span>
                  </div>
                  {hashtags.map((tag, index) => (
                    <span key={index} className="hashtag-tag">#{tag}</span>
                  ))}
                </div>
                
                {streamError && (
                  <div className="stream-error streaming">
                    <span className="error-icon">⚠️</span>
                    <span>{streamError}</span>
                    <button 
                      className="dismiss-error" 
                      onClick={() => setStreamError(null)}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              
              {shareUrl && (
                <div className="stream-url-container">
                  <p>Share this URL with your viewers:</p>
                  <div className="stream-url">
                    <input 
                      type="text" 
                      value={shareUrl} 
                      readOnly 
                      onClick={(e) => e.target.select()} 
                    />
                    <button onClick={copyStreamUrl}>
                      <FaCopy /> Copy
                    </button>
                  </div>
                </div>
              )}
              
              <div className="stream-description">
                <h3>About this stream</h3>
                <p>{description || "No description provided"}</p>
              </div>
            </div>

            {/* Chat Section */}
            <div className="chat-section">
              <div className="chat-header">
                <h3>Live Chat</h3>
                <span className="viewers-count">{viewerCount} watching</span>
              </div>
              
              <div className="chat-messages" ref={chatContainerRef}>
                {chatMessages.length > 0 ? (
                  chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`chat-message ${msg.userId === user?.uid ? "own-message" : ""}`}
                    >
                      <div className="message-header">
                        <img 
                          src={msg.photoURL || "https://via.placeholder.com/24"} 
                          alt={msg.username} 
                          className="user-avatar" 
                        />
                        <span className="username">{msg.username}</span>
                        <span className="timestamp">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="message-content">{msg.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="no-messages">
                    <p>No messages yet. Your chat will appear here.</p>
                  </div>
                )}
              </div>
              
              <form className="chat-input-container" onSubmit={sendChatMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="chat-input"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()} 
                  className="send-button"
                >
                  Chat
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamerDashboard;