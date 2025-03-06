import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { 
  FaUserFriends, 
  FaRegClock, 
  FaShare, 
  FaCopy, 
  FaDesktop, 
  FaVideo, 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaCamera, 
  FaCheck,
  FaUserPlus,
  FaExchangeAlt
} from "react-icons/fa";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import io from "socket.io-client";
import "../styles/Stream.css";
import { generateUniqueId } from "./utils/helpers";

// Constants moved outside component
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

// ICE server configuration moved to a constant
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" }
];

// Custom hook for media device checks
const useDeviceCheck = () => {
  const [isDeviceAllowed, setIsDeviceAllowed] = useState(true);
  
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsDeviceAllowed(!isMobile);
    };
    
    checkDevice();
    window.addEventListener("resize", checkDevice);
    
    return () => window.removeEventListener("resize", checkDevice);
  }, []);
  
  return isDeviceAllowed;
};

// Custom hook for formatting time
const useTimeFormatter = () => {
  return useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? String(hours).padStart(2, "0") : null,
      String(minutes).padStart(2, "0"),
      String(secs).padStart(2, "0")
    ].filter(Boolean).join(":");
  }, []);
};

// Utility function for dataURL to Blob conversion
const dataURLtoBlob = (dataURL) => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const StreamerDashboard = ({ user }) => {
  // Custom hooks
  const isDeviceAllowed = useDeviceCheck();
  const formatDuration = useTimeFormatter();

  // Refs
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const chatContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const guestAudioRefs = useRef({});

  // Stream setup state
  const [streamTitle, setStreamTitle] = useState("");
  const [category, setCategory] = useState(STREAM_CATEGORIES[0]);
  const [description, setDescription] = useState("");
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

  // Stream options
  const [streamSource, setStreamSource] = useState("camera");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenWithAudio, setScreenWithAudio] = useState(false);
  
  // Connection state
  const [socketConnected, setSocketConnected] = useState(false);

  // Guest management state
  const [displayMode, setDisplayMode] = useState("default"); // default, videoLarge, screenLarge
  const [guestMode, setGuestMode] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [guests, setGuests] = useState([]);
  const [guestConnections, setGuestConnections] = useState({}); // Store peer connections for guests
  const [selectedGuest, setSelectedGuest] = useState(null);

  // Username derived from user object
  const username = useMemo(() => {
    return user?.displayName || user?.email?.split("@")[0] || "Anonymous";
  }, [user]);

  // Socket connection setup
  useEffect(() => {
    if (!isDeviceAllowed) return;

    // Configure socket with options
    const socketOptions = {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true
    };

    // Create socket connection
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:4000", socketOptions);

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

    // Guest related handlers
    const handleGuestRequest = async (data) => {
      if (data.streamId === streamId) {
        const { guestId, guestName, audioOnly } = data;
        
        // Add guest to guests list with pending status
        setGuests(prev => [...prev, {
          id: guestId,
          name: guestName,
          status: "pending",
          audioOnly
        }]);
      }
    };

    const handleGuestJoined = (data) => {
      if (data.streamId === streamId) {
        const { guestId } = data;
        
        // Update guest status to connected
        setGuests(prev => prev.map(guest => 
          guest.id === guestId 
            ? { ...guest, status: "connected" } 
            : guest
        ));
      }
    };

    const handleGuestLeft = (data) => {
      if (data.streamId === streamId) {
        const { guestId } = data;
        
        // Close peer connection if exists
        if (guestConnections[guestId]) {
          guestConnections[guestId].close();
          
          // Remove from connections
          setGuestConnections(prev => {
            const newConnections = { ...prev };
            delete newConnections[guestId];
            return newConnections;
          });
        }
        
        // Remove guest from list
        setGuests(prev => prev.filter(guest => guest.id !== guestId));
        
        // If this was the selected guest, reset selected guest
        if (selectedGuest === guestId) {
          setSelectedGuest(null);
        }
      }
    };

    // WebRTC event handlers
    const handleAnswer = async (data) => {
      try {
        if (peerRef.current && data.sdp) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          console.log("Remote description set successfully");
        }
      } catch (error) {
        console.error("Error setting remote description:", error);
        setStreamError("Connection error. Please try restarting your stream.");
      }
    };

    const handleIceCandidate = async (data) => {
      try {
        if (peerRef.current && data.candidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    };

    const handleGuestOffer = async (data) => {
      try {
        const { guestId, sdp } = data;
        
        if (!guestId || !sdp) return;
        
        // Create a new peer connection for this guest
        const guestConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        
        // Set up ICE candidate handling
        guestConnection.onicecandidate = (event) => {
          if (event.candidate && socketRef.current && socketRef.current.connected) {
            socketRef.current.emit("guest-ice-candidate", {
              candidate: event.candidate,
              streamerId: streamId,
              guestId
            });
          }
        };
        
        // Handle incoming audio stream from guest
        guestConnection.ontrack = (event) => {
          const guest = guests.find(g => g.id === guestId);
          if (guest && event.streams[0]) {
            // Create audio element for guest if not exists
            if (!guestAudioRefs.current[guestId]) {
              const audioEl = new Audio();
              audioEl.autoplay = true;
              audioEl.srcObject = event.streams[0];
              guestAudioRefs.current[guestId] = audioEl;
              
              // Update guest status
              setGuests(prev => prev.map(g => 
                g.id === guestId ? { ...g, hasAudio: true } : g
              ));
            }
          }
        };
        
        // Set remote description (offer from guest)
        await guestConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        
        // Create answer
        const answer = await guestConnection.createAnswer();
        await guestConnection.setLocalDescription(answer);
        
        // Send answer to guest
        socketRef.current.emit("guest-answer", {
          sdp: guestConnection.localDescription,
          streamerId: streamId,
          guestId
        });
        
        // Save the connection
        setGuestConnections(prev => ({
          ...prev,
          [guestId]: guestConnection
        }));
        
      } catch (error) {
        console.error("Error handling guest connection:", error);
      }
    };

    const handleGuestIceCandidate = async (data) => {
      try {
        const { guestId, candidate } = data;
        
        if (guestConnections[guestId] && candidate) {
          await guestConnections[guestId].addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error("Error adding guest ICE candidate:", error);
      }
    };

    // Register all event handlers
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("viewer-count", handleViewerCount);
    socket.on("chat-message", handleChatMessage);
    socket.on("guest-request", handleGuestRequest);
    socket.on("guest-joined", handleGuestJoined);
    socket.on("guest-left", handleGuestLeft);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("guest-offer", handleGuestOffer);
    socket.on("guest-ice-candidate", handleGuestIceCandidate);

    // Clean up on unmount
    return () => {
      // Unregister all event handlers
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("viewer-count", handleViewerCount);
      socket.off("chat-message", handleChatMessage);
      socket.off("guest-request", handleGuestRequest);
      socket.off("guest-joined", handleGuestJoined);
      socket.off("guest-left", handleGuestLeft);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("guest-offer", handleGuestOffer);
      socket.off("guest-ice-candidate", handleGuestIceCandidate);
      
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [isDeviceAllowed, streamId, streamActive, guests, guestConnections, selectedGuest]);

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

  // Combine streams if needed (camera + screen)
  const combineStreams = useCallback((cameraStream, screenStream) => {
    if (!cameraStream && !screenStream) return null;
    
    // If only one stream is provided, return it
    if (!cameraStream) return screenStream;
    if (!screenStream) return cameraStream;
    
    // Combine audio tracks (prefer screen audio if available)
    const audioTracks = screenWithAudio && screenStream.getAudioTracks().length > 0
      ? screenStream.getAudioTracks()
      : cameraStream.getAudioTracks();
    
    // Get video tracks
    const videoTracks = [
      ...screenStream.getVideoTracks(),
      ...cameraStream.getVideoTracks()
    ];
    
    // Create a new MediaStream with all tracks
    return new MediaStream([...audioTracks, ...videoTracks]);
  }, [screenWithAudio]);

  // Initialize WebRTC connection
  const initializeWebRTC = useCallback(async (mediaStream, streamIdentifier) => {
    try {
      // Create peer connection with optimized ICE servers
      peerRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      
      // Add tracks to peer connection
      mediaStream.getTracks().forEach((track) => {
        peerRef.current.addTrack(track, mediaStream);
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

  // Stop streaming
  const stopStream = useCallback(() => {
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clean up video elements
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }
    
    // Close peer connection
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    
    // Close all guest connections
    Object.values(guestConnections).forEach(connection => {
      if (connection) {
        connection.close();
      }
    });
    
    // Clean up guest audio elements
    Object.values(guestAudioRefs.current).forEach(audioEl => {
      if (audioEl) {
        audioEl.srcObject = null;
        audioEl.remove();
      }
    });
    
    // Reset guest refs
    guestAudioRefs.current = {};
    
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
    setGuests([]);
    setGuestConnections({});
    setSelectedGuest(null);
    setGuestMode(false);
    setInviteLink("");
    setDisplayMode("default");
    
    console.log("Stream stopped!");
  }, [streamId, guestConnections]);

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
      let mediaStream = null;
      
      // Get stream based on selection
      if (streamSource === "camera") {
        console.log("Requesting camera and microphone access...");
        mediaStream = await navigator.mediaDevices.getUserMedia({
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
        });
      } else if (streamSource === "screen") {
        console.log("Requesting screen sharing access...");
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "window"
          },
          audio: screenWithAudio
        });
        
        // Handle user stopping screen share
        mediaStream.getVideoTracks()[0].onended = () => {
          if (streamActive) {
            setStreamError("Screen sharing was stopped. Your stream has ended.");
            stopStream();
          }
        };
      } else if (streamSource === "both") {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true, 
          audio: !screenWithAudio
        });
        
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: screenWithAudio
        });
        
        // Handle user stopping screen share
        screenStream.getVideoTracks()[0].onended = () => {
          if (streamActive) {
            setStreamError("Screen sharing was stopped. Your stream has ended.");
            stopStream();
          }
        };
        
        mediaStream = combineStreams(cameraStream, screenStream);
      }
      
      if (!mediaStream) {
        throw new Error("Failed to create media stream");
      }
      
      // Save stream reference for cleanup
      streamRef.current = mediaStream;
      
      // Display preview in video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Also set preview if needed
      if (previewRef.current && (streamSource === "screen" || streamSource === "both")) {
        previewRef.current.srcObject = mediaStream;
      }
      
      // Generate a unique stream ID
      const uniqueStreamId = generateUniqueId();
      setStreamId(uniqueStreamId);
      
      // Generate guest invite link
      const guestInviteUrl = `${window.location.origin}/guest/${uniqueStreamId}`;
      setInviteLink(guestInviteUrl);
      
      // Initialize WebRTC
      const rtcInitialized = await initializeWebRTC(mediaStream, uniqueStreamId);
      
      if (!rtcInitialized) {
        throw new Error("Failed to initialize WebRTC connection");
      }
      
      // Prepare stream data
      const newStream = {
        id: uniqueStreamId,
        title: streamTitle,
        category,
        description,
        username,
        userId: user?.uid,
        photoURL: user?.photoURL || null,
        viewers: 0,
        startTime: Date.now(),
        streamType: streamSource,
        allowGuests: true // Enable guest functionality
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
      
      // More specific error messages based on error type
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "Camera, microphone, or screen access denied. Please enable permissions in your browser settings.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "Camera or microphone not found. Please check your device connections.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage = "Your camera or microphone is already in use by another application.";
      }
      
      setStreamError(errorMessage);
      
      // Clean up any partial setup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    streamTitle,
    category,
    description,
    acceptedTerms,
    isDeviceAllowed,
    socketConnected,
    username,
    user,
    streamActive,
    initializeWebRTC,
    streamSource,
    screenWithAudio,
    combineStreams,
    stopStream
  ]);

  // UI action handlers
  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !audioTracks[0].enabled;
        audioTracks.forEach(track => {
          track.enabled = enabled;
        });
        setAudioEnabled(enabled);
      }
    }
  }, []);

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prevMode => {
      if (prevMode === "default") return "videoLarge";
      if (prevMode === "videoLarge") return "screenLarge";
      return "default";
    });
  }, []);

  const copyStreamUrl = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert("Stream URL copied to clipboard!");
        })
        .catch(err => {
          console.error("Failed to copy URL:", err);
        });
    }
  }, [shareUrl]);

  const takeScreenshot = useCallback(() => {
    if (!videoRef.current) return;
    
    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    
    // Draw the current video frame to the canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // Convert canvas to image and trigger download
      const dataURL = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `stream-screenshot-${new Date().toISOString().substring(0, 19).replace(/:/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Attempt to use Web Share API for mobile sharing
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [dataURLtoBlob(dataURL)] })) {
        const file = dataURLtoBlob(dataURL);
        navigator.share({
          files: [new File([file], 'screenshot.png', { type: 'image/png' })],
          title: streamTitle,
          text: 'Check out my trading stream!'
        }).catch(err => console.error('Error sharing screenshot:', err));
      }
    } catch (error) {
      console.error("Error creating screenshot:", error);
    }
  }, [streamTitle]);

  const shareStream = useCallback(() => {
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
  }, [shareUrl, streamTitle, copyStreamUrl]);

  const copyGuestInviteLink = useCallback(() => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          alert("Guest invite link copied to clipboard!");
        })
        .catch(err => {
          console.error("Failed to copy invite link:", err);
        });
    }
  }, [inviteLink]);

  const toggleGuestMode = useCallback(() => {
    setGuestMode(prev => !prev);
  }, []);

  const acceptGuest = useCallback((guestId) => {
    if (!socketRef.current || !socketRef.current.connected || !streamId) return;
    
    socketRef.current.emit("accept-guest", {
      streamerId: streamId,
      guestId
    });
    
    // Update guest status
    setGuests(prev => prev.map(guest => 
      guest.id === guestId ? { ...guest, status: "accepted" } : guest
    ));
  }, [streamId]);

  const removeGuest = useCallback((guestId) => {
    if (!socketRef.current || !socketRef.current.connected || !streamId) return;
    
    socketRef.current.emit("remove-guest", {
      streamerId: streamId,
      guestId
    });
    
    // Close peer connection if exists
    if (guestConnections[guestId]) {
      guestConnections[guestId].close();
      
      // Remove from connections
      setGuestConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[guestId];
        return newConnections;
      });
    }
    
    // Remove audio element if exists
    if (guestAudioRefs.current[guestId]) {
      guestAudioRefs.current[guestId].srcObject = null;
      delete guestAudioRefs.current[guestId];
    }
    
    // Remove guest from list
    setGuests(prev => prev.filter(guest => guest.id !== guestId));
    
    // If this was the selected guest, reset selected guest
    if (selectedGuest === guestId) {
      setSelectedGuest(null);
    }
  }, [streamId, guestConnections, selectedGuest]);

  const selectGuest = useCallback((guestId) => {
    setSelectedGuest(prevSelected => prevSelected === guestId ? null : guestId);
  }, []);

  const sendChatMessage = useCallback((e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !streamId || !socketRef.current) return;
    
    const message = {
      streamId: streamId,
      userId: user.uid,
      username,
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
  }, [newMessage, user, streamId, username]);

  // Memoized components
  const StreamSetupScreen = useMemo(() => (
    <div className="stream-setup modern-ui">
      <div className="setup-header">
        <h2>START YOUR STREAM</h2>
        <p>Quick and simple streaming setup</p>
      </div>

      {streamError && (
        <div className="stream-error-message">
          <span>{streamError}</span>
          <button onClick={() => setStreamError(null)}>✕</button>
        </div>
      )}

      <div className="setup-form">
        <div className="form-group">
          <label htmlFor="stream-title">Stream Title*</label>
          <input
            id="stream-title"
            type="text"
            placeholder="Enter a title for your stream"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            maxLength={100}
          />
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
            placeholder="Describe what your stream is about..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={500}
          ></textarea>
          <div className="char-count">{description.length}/500</div>
        </div>

        <div className="source-section">
          <h3>Stream Source</h3>
          <div className="source-options">
            <div 
              className={`source-option ${streamSource === "camera" ? "selected" : ""}`}
              onClick={() => setStreamSource("camera")}
            >
              <FaVideo className="source-icon" />
              <span>Camera</span>
              {streamSource === "camera" && <div className="selection-indicator"><FaCheck /></div>}
            </div>
            <div 
              className={`source-option ${streamSource === "screen" ? "selected" : ""}`}
              onClick={() => setStreamSource("screen")}
            >
              <FaDesktop className="source-icon" />
              <span>Screen</span>
              {streamSource === "screen" && <div className="selection-indicator"><FaCheck /></div>}
            </div>
            <div 
              className={`source-option ${streamSource === "both" ? "selected" : ""}`}
              onClick={() => setStreamSource("both")}
            >
              <span className="combined-icon">
                <FaDesktop className="source-icon" />
                <FaVideo className="source-icon" />
              </span>
              <span>Both</span>
              {streamSource === "both" && <div className="selection-indicator"><FaCheck /></div>}
            </div>
          </div>
        </div>

        {(streamSource === "screen" || streamSource === "both") && (
          <div className="form-group inline-checkbox">
            <input
              type="checkbox"
              id="screen-audio"
              checked={screenWithAudio}
              onChange={() => setScreenWithAudio(!screenWithAudio)}
            />
            <label htmlFor="screen-audio">Include audio from screen share</label>
          </div>
        )}

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
          className={`stream-button ${acceptedTerms && socketConnected ? "enabled" : "disabled"}`}
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
            <p>Waiting for server connection...</p>
            <button onClick={() => window.location.reload()}>
              Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  ), [
    streamError, 
    streamTitle, 
    category, 
    description, 
    streamSource, 
    screenWithAudio, 
    acceptedTerms, 
    socketConnected, 
    isLoading, 
    startStream
  ]);

  // Guest list component
  const GuestList = useMemo(() => (
    <div className="guests-list">
      <h4>Guests ({guests.length})</h4>
      {guests.length > 0 ? (
        <ul>
          {guests.map((guest) => (
            <li key={guest.id} className={`guest-item ${guest.status} ${selectedGuest === guest.id ? 'selected' : ''}`}>
              <div className="guest-info">
                <FaMicrophone className="guest-icon" />
                <span>{guest.name}</span>
                <span className="guest-status">{guest.status}</span>
              </div>
              <div className="guest-actions">
                {guest.status === "pending" && (
                  <button onClick={() => acceptGuest(guest.id)} className="accept-button">
                    Accept
                  </button>
                )}
                {guest.status === "connected" && (
                  <button onClick={() => selectGuest(guest.id)} className="focus-button">
                    {selectedGuest === guest.id ? "Unfocus" : "Focus"}
                  </button>
                )}
                <button onClick={() => removeGuest(guest.id)} className="remove-button">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-guests">No guests yet. Share your invite link to bring in guests.</p>
      )}
    </div>
  ), [guests, selectedGuest, acceptGuest, removeGuest, selectGuest]);

  // Chat messages component
  const ChatMessages = useMemo(() => (
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
            <p>{msg.message}</p>
          </div>
        ))
      ) : (
        <div className="no-messages">
          <p>No messages yet.</p>
        </div>
      )}
    </div>
  ), [chatMessages, user?.uid]);

  // If device is not allowed, show error message
  if (!isDeviceAllowed) {
    return (
      <div className="stream-error-container">
        <h2>Device Not Supported</h2>
        <p>Streaming is only available on desktop devices.</p>
        <button onClick={() => window.history.back()} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p2p-streamer-container">
      {showStreamSetup ? (
        // Stream Setup Screen
        StreamSetupScreen
      ) : (
        // Active Stream Screen
        <div className="active-stream-container">
          <div className="stream-header">
            <div className="stream-info">
              <img 
                src={user?.photoURL || "https://via.placeholder.com/40"} 
                alt={user?.displayName} 
                className="streamer-avatar" 
              />
              <div>
                <h2>{streamTitle}</h2>
                <p>
                  {username}
                  <span className="category-badge">{category}</span>
                </p>
              </div>
            </div>
            <div className="stream-stats">
              <div className="stat">
                <FaUserFriends />
                <span>{viewerCount}</span>
              </div>
              <div className="stat">
                <FaRegClock />
                <span>{formatDuration(streamDuration)}</span>
              </div>
            </div>
          </div>

          <div className="stream-content">
            {/* Main Stream Content - Now with flexible layout */}
            <div className={`video-section ${displayMode}`}>
              {/* Main Video Container */}
              <div className={`video-container ${displayMode === "screenLarge" ? "secondary" : "primary"}`}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="stream-video" 
                />
                
                {streamError && (
                  <div className="stream-error-overlay">
                    <span>{streamError}</span>
                    <button onClick={() => setStreamError(null)}>✕</button>
                  </div>
                )}
                
                <div className="video-label">Camera Feed</div>
              </div>
              
              {/* Screen Share Container */}
              {(streamSource === "screen" || streamSource === "both") && (
                <div className={`screen-container ${displayMode === "videoLarge" ? "secondary" : "primary"}`}>
                  <video 
                    ref={previewRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="screen-video" 
                  />
                  <div className="video-label">Screen Share</div>
                </div>
              )}
              
              {/* Display mode toggle button */}
              {(streamSource === "screen" || streamSource === "both") && (
                <button 
                  className="display-mode-toggle" 
                  onClick={toggleDisplayMode}
                  title="Switch Display Layout"
                >
                  <FaExchangeAlt />
                  <span>Switch Layout</span>
                </button>
              )}
              
              {/* Stream Controls */}
              <div className="stream-controls">
                <button 
                  className="control-button" 
                  onClick={toggleAudio}
                  title={audioEnabled ? "Mute Audio" : "Unmute Audio"}
                >
                  {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
                </button>
                <button 
                  className="control-button" 
                  onClick={takeScreenshot}
                  title="Take Screenshot"
                >
                  <FaCamera />
                </button>
                <button 
                  className="control-button share-button" 
                  onClick={shareStream}
                  title="Share Stream"
                >
                  <FaShare />
                </button>
                <button 
                  className="control-button copy-button" 
                  onClick={copyStreamUrl}
                  title="Copy Stream URL"
                >
                  <FaCopy />
                </button>
                <button 
                  className={`control-button ${guestMode ? "active" : ""}`} 
                  onClick={toggleGuestMode}
                  title={guestMode ? "Hide Guest Panel" : "Show Guest Panel"}
                >
                  <FaUserPlus />
                </button>
                <button 
                  className="control-button stop-button" 
                  onClick={stopStream}
                  title="Stop Streaming"
                >
                  Stop Stream
                </button>
              </div>
            </div>

            {/* Right Side Panel - Chat and Guest Management */}
            <div className="right-panel">
              {/* Guest Management Panel */}
              {guestMode && (
                <div className="guest-management-panel">
                  <div className="panel-header">
                    <h3>Guest Management</h3>
                    <button onClick={toggleGuestMode} className="close-button">✕</button>
                  </div>
                  
                  <div className="invite-section">
                    <p>Share this link to invite audio guests:</p>
                    <div className="invite-link-container">
                      <input 
                        type="text" 
                        value={inviteLink} 
                        readOnly 
                        onClick={(e) => e.target.select()} 
                      />
                      <button onClick={copyGuestInviteLink}>
                        <FaCopy /> Copy
                      </button>
                    </div>
                  </div>
                  
                  {GuestList}
                </div>
              )}

              {/* Chat Section */}
              <div className="chat-section">
                <div className="chat-header">
                  <h3>Live Chat</h3>
                  <span>{viewerCount} watching</span>
                </div>
                
                {ChatMessages}
                
                <form className="chat-input" onSubmit={sendChatMessage}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()} 
                  >
                    Chat
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamerDashboard;