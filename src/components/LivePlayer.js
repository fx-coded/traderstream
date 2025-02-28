import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaShare, FaUserFriends, FaRegClock } from "react-icons/fa";
import { doc, getDoc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "../styles/LivePlayer.css";

const LivePlayer = ({ user }) => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [streamDuration, setStreamDuration] = useState(0);
  const [isDeviceAllowed, setIsDeviceAllowed] = useState(true);
  
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);

  // Check if device is desktop
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      setIsDeviceAllowed(!isMobile);
      
      if (isMobile) {
        setError("Streaming is only available on desktop devices");
      }
    };
    
    checkDevice();
    window.addEventListener("resize", checkDevice);
    
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Fetch stream data
  useEffect(() => {
    if (!streamId) return;
    
    const fetchStream = async () => {
      try {
        setLoading(true);
        
        const streamDoc = await getDoc(doc(db, "streams", streamId));
        
        if (!streamDoc.exists()) {
          setError("Stream not found or no longer available");
          setLoading(false);
          return;
        }
        
        const streamData = streamDoc.data();
        setStream(streamData);
        
        // Listen for real-time updates to the stream
        const unsubscribe = onSnapshot(doc(db, "streams", streamId), (doc) => {
          if (doc.exists()) {
            setStream(doc.data());
          } else {
            setError("Stream has ended");
            navigate("/live-streams");
          }
        });
        
        setLoading(false);
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching stream:", error);
        setError("Failed to load stream");
        setLoading(false);
      }
    };
    
    fetchStream();
  }, [streamId, navigate]);

  // Connect to stream via WebRTC
  useEffect(() => {
    if (!streamId || !isDeviceAllowed || loading) return;
    
    const connectToStream = async () => {
      try {
        // Initialize socket connection
        socketRef.current = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:4000");
        
        // Join the stream room
        socketRef.current.emit("join-stream", { streamerId: streamId });
        
        // Set up peer connection
        peerRef.current = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
          ]
        });
        
        // Handle incoming tracks
        peerRef.current.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        };
        
        // Handle ICE candidates
        peerRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit("ice-candidate", {
              candidate: event.candidate,
              target: streamId
            });
          }
        };
        
        // Listen for offers from the streamer
        socketRef.current.on("offer", async (data) => {
          if (data.from === streamId) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
            
            const answer = await peerRef.current.createAnswer();
            await peerRef.current.setLocalDescription(answer);
            
            socketRef.current.emit("answer", {
              sdp: peerRef.current.localDescription,
              target: streamId
            });
          }
        });
        
        // Handle ICE candidates from the streamer
        socketRef.current.on("ice-candidate", async (data) => {
          if (peerRef.current) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
              console.error("Error adding ICE candidate:", error);
            }
          }
        });
        
        // Listen for viewer count updates
        socketRef.current.on("viewer-count", (data) => {
          if (data.streamerId === streamId) {
            setViewerCount(data.count);
          }
        });
        
        // Listen for stream ended event
        socketRef.current.on("stream-ended", (data) => {
          if (data.streamerId === streamId) {
            setError("Stream has ended");
            navigate("/live-streams");
          }
        });
      } catch (error) {
        console.error("Error connecting to stream:", error);
        setError("Failed to connect to stream");
      }
    };
    
    connectToStream();
    
    return () => {
      // Clean up
      if (socketRef.current) {
        socketRef.current.emit("leave-stream", { streamerId: streamId });
        socketRef.current.disconnect();
      }
      
      if (peerRef.current) {
        peerRef.current.close();
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [streamId, isDeviceAllowed, loading, navigate]);

  // Load chat messages
  useEffect(() => {
    if (!streamId) return;
    
    const messagesRef = collection(db, "streams", streamId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .reverse();
        
      setMessages(fetchedMessages);
      
      // Scroll to bottom of chat
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    });
    
    return () => unsubscribe();
  }, [streamId]);

  // Track stream duration
  useEffect(() => {
    if (!stream || !stream.startTime) return;
    
    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - stream.startTime) / 1000);
      setStreamDuration(duration);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [stream]);

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

  // Send a chat message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    try {
      await addDoc(collection(db, "streams", streamId, "messages"), {
        text: newMessage.trim(),
        userId: user.uid,
        username: user.displayName || user.email?.split("@")[0] || "Anonymous",
        photoURL: user.photoURL || null,
        timestamp: serverTimestamp()
      });
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Share stream
  const shareStream = () => {
    const streamUrl = `${window.location.origin}/viewer/${streamId}`;
    
    if (navigator.share) {
      navigator.share({
        title: stream?.title || "Live Stream",
        text: `Check out this live stream: ${stream?.title}`,
        url: streamUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(streamUrl).then(() => {
        alert("Stream link copied to clipboard!");
      }).catch(console.error);
    }
  };

  if (loading) {
    return (
      <div className="twitch-viewer-loading">
        <div className="loading-spinner"></div>
        <p>Loading stream...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="twitch-viewer-error">
        <h2>Stream Unavailable</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/live-streams")} className="back-button">
          Back to Streams
        </button>
      </div>
    );
  }

  if (!isDeviceAllowed) {
    return (
      <div className="twitch-viewer-error">
        <h2>Device Not Supported</h2>
        <p>Streaming is only available on desktop devices.</p>
        <button onClick={() => navigate("/live-streams")} className="back-button">
          Back to Streams
        </button>
      </div>
    );
  }

  return (
    <div className="twitch-viewer-container">
      {/* Stream Header */}
      <div className="stream-header">
        <div className="streamer-info">
          <img 
            src={stream?.photoURL || "https://via.placeholder.com/40"} 
            alt={stream?.username} 
            className="streamer-avatar" 
          />
          <div className="streamer-details">
            <h2 className="stream-title">{stream?.title || "Live Stream"}</h2>
            <p className="streamer-name">{stream?.username || "Trader"}</p>
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
          <button className="share-button" onClick={shareStream}>
            <FaShare /> Share
          </button>
        </div>
      </div>

      <div className="stream-content">
        {/* Main Video */}
        <div className="video-section">
          <div className="video-container">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="stream-video" 
            />
            <div className="video-overlay">
              <div className="stream-category">
                <span className="category-tag">{stream?.category || "Trading"}</span>
              </div>
              {stream?.hashtags?.map((tag, index) => (
                <span key={index} className="hashtag-tag">#{tag}</span>
              ))}
            </div>
          </div>
          
          <div className="stream-description">
            <h3>About this stream</h3>
            <p>{stream?.description || "Join this trading stream to learn and discuss strategies."}</p>
          </div>
        </div>

        {/* Chat Section */}
        <div className="chat-section">
          <div className="chat-header">
            <h3>Live Chat</h3>
            <span className="viewers-count">{viewerCount} watching</span>
          </div>
          
          <div className="chat-messages" ref={chatContainerRef}>
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
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
                      {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="message-content">{msg.text}</p>
                </div>
              ))
            ) : (
              <div className="no-messages">
                <p>No messages yet. Be the first to chat!</p>
              </div>
            )}
          </div>
          
          <form className="chat-input-container" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder={user ? "Send a message..." : "Login to chat"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!user}
              className="chat-input"
            />
            <button 
              type="submit" 
              disabled={!user || !newMessage.trim()} 
              className="send-button"
            >
              Chat
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LivePlayer;