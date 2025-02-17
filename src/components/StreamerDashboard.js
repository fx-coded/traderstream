import React, { useState, useRef, useEffect, useCallback } from "react";
import io from "socket.io-client";
import "../styles/Stream.css";

const socket = io("http://localhost:4000", { transports: ["websocket", "polling"] });

const StreamerDashboard = ({ user, onStartStreaming }) => {
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const chatInputRef = useRef(null);

  const [streamTitle, setStreamTitle] = useState("");
  const [category, setCategory] = useState("Forex Trading");
  const [hashtags, setHashtags] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showStreamSetup, setShowStreamSetup] = useState(true);
  const [streamId, setStreamId] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // ✅ Ensure the <video> element is mounted before allowing streaming
  useEffect(() => {
    const checkVideoElement = setInterval(() => {
      if (videoRef.current) {
        setVideoReady(true);
        clearInterval(checkVideoElement);
      }
    }, 100);
    return () => clearInterval(checkVideoElement);
  }, []);

  useEffect(() => {
    socket.on("chat-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("viewer-count", (count) => {
      setViewerCount(count);
    });

    return () => {
      socket.off("chat-message");
      socket.off("viewer-count");
    };
  }, []);

  const startStream = useCallback(async () => {
    if (!streamTitle.trim()) {
      alert("❌ Please enter a stream title.");
      return;
    }
    if (!acceptedTerms) {
      alert("⚠️ You must accept the Terms & Conditions to start streaming.");
      return;
    }

    // ✅ Delay check to ensure the videoRef is available
    setTimeout(async () => {
      if (!videoRef.current) {
        alert("❌ Video element is still missing. Try refreshing the page.");
        console.error("❌ Video element is missing.");
        return;
      }

      try {
        console.log("🎥 Requesting Camera & Mic Access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });

        videoRef.current.srcObject = stream;
        peerRef.current = new RTCPeerConnection();
        stream.getTracks().forEach((track) => peerRef.current.addTrack(track, stream));

        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit("offer", { sdp: peerRef.current.localDescription, target: "viewer" });

        const newStream = {
          id: socket.id,
          title: streamTitle,
          category,
          hashtags,
          username: user?.displayName || user?.email?.split("@")[0] || "Anonymous",
          viewers: 0,
          thumbnail: "https://via.placeholder.com/320x180.png?text=Live+Stream",
        };

        setStreamId(socket.id);
        onStartStreaming(newStream);
        socket.emit("start-stream", newStream);
        setShowStreamSetup(false);
        console.log(`📡 Stream started! ID: ${socket.id}`);
      } catch (error) {
        console.error("❌ Streaming Error:", error);
        alert("Failed to access camera/microphone. Please allow permissions.");
      }
    }, 200);
  }, [streamTitle, acceptedTerms, category, hashtags, user?.displayName, user?.email, onStartStreaming]);

  const stopStream = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    socket.emit("stop-stream");
    setShowStreamSetup(true);
    console.log("🛑 Stream stopped!");
  };

  const sendMessage = () => {
    const message = chatInputRef.current.value;
    if (message.trim()) {
      socket.emit("chat-message", { user: user?.displayName || "Streamer", text: message });
      setMessages([...messages, { user: "Me", text: message }]);
      chatInputRef.current.value = "";
    }
  };

  const addHashtag = (event) => {
    if (event.key === "Enter" && event.target.value.trim()) {
      setHashtags([...hashtags, event.target.value.trim()]);
      event.target.value = "";
    }
  };

  return (
    <div className="streamerdash-container">
      {showStreamSetup ? (
        <div className="stream-setup">
          <h2>🎥 Start Your Live Stream</h2>
          <input
            type="text"
            placeholder="Stream Title"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Forex Trading</option>
            <option>Crypto Trading</option>
            <option>Futures & Commodities</option>
            <option>Meme Coin Degens</option>
            <option>Gold, Oil & Indices</option>
          </select>

          <div className="hashtag-container">
            <input type="text" placeholder="Type a hashtag and press Enter..." onKeyDown={addHashtag} />
            <div className="hashtag-list">
              {hashtags.map((tag, index) => (
                <span key={index} className="hashtag">#{tag}</span>
              ))}
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
              I accept the <a href="/terms">Terms & Conditions</a>
            </label>
          </div>

          <p>👤 Username: {user?.displayName || user?.email?.split("@")[0] || "Anonymous"}</p>
          <button onClick={startStream} disabled={!videoReady}>✅ Start Streaming</button>
        </div>
      ) : (
        <>
          <div className="streamerdash-header">
            <h1>📡 Live Stream - {streamTitle}</h1>
            <p>📌 {category} | 🎤 {user?.displayName || user?.email?.split("@")[0] || "Anonymous"}</p>
            <p>👀 Viewers: {viewerCount}</p>
            {streamId && <p>🔗 Share Link: <a href={`/viewer/${streamId}`}>/viewer/{streamId}</a></p>}
          </div>
          <div className="streamerdash-main">
            <div className="streamerdash-stream">
              <video ref={videoRef} autoPlay playsInline muted className="streamerdash-video" />
            </div>
            <div className="streamerdash-chat">
              <h3>💬 Live Chat</h3>
              <div className="streamerdash-chat-messages">
                {messages.map((msg, index) => (
                  <p key={index}><strong>{msg.user}:</strong> {msg.text}</p>
                ))}
              </div>
              <input ref={chatInputRef} type="text" placeholder="Type a message..." />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
          <div className="streamerdash-controls">
            <button className="streamerdash-stop-btn" onClick={stopStream}>🛑 Stop Stream</button>
          </div>
        </>
      )}
    </div>
  );
};

export default StreamerDashboard;
