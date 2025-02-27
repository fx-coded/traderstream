import React, { useState, useRef, useCallback, useEffect } from "react";
import io from "socket.io-client";
import "../styles/Stream.css";

// Move socket configuration to environment variables for flexibility
const SOCKET_SERVER = process.env.REACT_APP_SOCKET_URL || "http://localhost:4000";
const socket = io(SOCKET_SERVER, { 
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});

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

const StreamerDashboard = ({ user, onStartStreaming }) => {
  // Refs
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  // Stream setup state
  const [streamTitle, setStreamTitle] = useState("");
  const [category, setCategory] = useState(STREAM_CATEGORIES[0]);
  const [hashtags, setHashtags] = useState([]);
  const [newHashtag, setNewHashtag] = useState("");
  const [showStreamSetup, setShowStreamSetup] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Stream status state
  const [videoReady, setVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [streamStartTime, setStreamStartTime] = useState(null);

  // Socket connection status
  const [socketConnected, setSocketConnected] = useState(false);

  // Monitor socket connection
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to streaming server");
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from streaming server");
      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setStreamError("Connection to streaming server failed. Please try again later.");
      setSocketConnected(false);
    });

    socket.on("viewer-count", ({ streamerId, count }) => {
      if (streamerId === socket.id) {
        setViewerCount(count);
      }
    });

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

    // Clean up socket event listeners
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("viewer-count");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

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

  // Format stream duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  // This function was moved inline to the startStream callback
  // to resolve the React Hook dependency warning

  // Initialize WebRTC connection
  const initializeWebRTC = async (stream) => {
    try {
      // Create peer connection
      peerRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });
      
      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerRef.current.addTrack(track, stream);
      });
      
      // Set up ICE candidate handling
      peerRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { 
            candidate: event.candidate, 
            streamerId: socket.id,
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
      
      socket.emit("offer", { 
        sdp: peerRef.current.localDescription, 
        streamerId: socket.id,
        target: "viewer" 
      });
      
      return true;
    } catch (error) {
      console.error("WebRTC setup error:", error);
      setStreamError("Failed to set up streaming connection. Please try again.");
      return false;
    }
  };

  // Start streaming
  const startStream = useCallback(async () => {
    setStreamError(null);
    
    // Inline validation to avoid hook dependency issues
    if (!streamTitle.trim()) {
      setStreamError("Please enter a stream title");
      return;
    }
    
    if (!acceptedTerms) {
      setStreamError("You must accept the Terms & Conditions to start streaming");
      return;
    }

    if (!socketConnected) {
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
      
      setVideoReady(true);
      
      // Initialize WebRTC
      const rtcInitialized = await initializeWebRTC(stream);
      
      if (!rtcInitialized) {
        throw new Error("Failed to initialize WebRTC connection");
      }
      
      // Prepare stream data
      const username = user?.displayName || user?.email?.split("@")[0] || "Anonymous";
      const newStream = {
        id: socket.id,
        title: streamTitle,
        category,
        hashtags,
        username,
        viewers: 0,
        startTime: Date.now(),
        thumbnail: user?.profilePic || null
      };
      
      // Notify server
      socket.emit("start-stream", newStream);
      
      // Update UI state
      setShowStreamSetup(false);
      setStreamActive(true);
      setStreamStartTime(Date.now());
      
      // Notify parent component
      if (typeof onStartStreaming === 'function') {
        onStartStreaming(newStream);
      }
      
      console.log(`Stream started! Stream ID: ${socket.id}`);
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
  }, [streamTitle, category, hashtags, acceptedTerms, user, socketConnected, onStartStreaming]);

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
    socket.emit("stop-stream", { streamerId: socket.id });
    
    // Reset state
    setShowStreamSetup(true);
    setStreamActive(false);
    setVideoReady(false);
    setViewerCount(0);
    setStreamDuration(0);
    setStreamStartTime(null);
    
    console.log("Stream stopped!");
  }, []);

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

  return (
    <div className="streamerdash-container">
      {showStreamSetup ? (
        <div className="stream-setup-container">
          <div className="stream-setup-header">
            <h2>Start Your Live Stream</h2>
            <p className="stream-setup-subheader">
              Set up your stream details below
            </p>
          </div>

          {streamError && (
            <div className="stream-error">
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

          <div className="stream-setup-form">
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
              className={`stream-button ${acceptedTerms ? "enabled-btn" : "disabled-btn"}`}
              onClick={startStream}
              disabled={isLoading || !acceptedTerms}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>Preparing Stream...</span>
                </>
              ) : videoReady ? (
                "Start Streaming"
              ) : (
                <>🎥 Start Streaming</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="active-stream-container">
          <div className="stream-header">
            <h2 className="stream-title">{streamTitle}</h2>
            <div className="stream-meta">
              <span className="stream-category">{category}</span>
              <span className="viewer-count">👁️ {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}</span>
              <span className="stream-duration">⏱️ {formatDuration(streamDuration)}</span>
            </div>
          </div>
          
          <div className="video-container">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="streamerdash-video" 
            />
            
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
          
          <div className="stream-controls">
            <div className="hashtag-display">
              {hashtags.map((tag, index) => (
                <span key={index} className="hashtag">#{tag}</span>
              ))}
            </div>
            
            <button 
              className="stop-stream-button" 
              onClick={stopStream}
            >
              Stop Stream
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamerDashboard;