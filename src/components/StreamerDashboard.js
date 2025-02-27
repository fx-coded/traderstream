import React, { useState, useRef, useCallback } from "react";
import io from "socket.io-client";
import "../styles/Stream.css";

const socket = io("http://localhost:4000", { transports: ["websocket", "polling"] });

const StreamerDashboard = ({ user, onStartStreaming }) => {
  const videoRef = useRef(null);
  const peerRef = useRef(null);

  const [streamTitle, setStreamTitle] = useState("");
  const [category, setCategory] = useState("Forex Trading");
  const [hashtags, setHashtags] = useState([]);
  const [showStreamSetup, setShowStreamSetup] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const startStream = useCallback(async () => {
    if (!streamTitle.trim()) {
      alert("❌ Please enter a stream title.");
      return;
    }
    if (!acceptedTerms) {
      alert("⚠️ You must accept the Terms & Conditions to start streaming.");
      return;
    }

    try {
      console.log("🎥 Requesting Camera & Mic Access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      videoRef.current.srcObject = stream;
      setVideoReady(true);

      peerRef.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => peerRef.current.addTrack(track, stream));

      peerRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { candidate: event.candidate, target: "viewer" });
        }
      };

      peerRef.current.ontrack = (event) => {
        console.log("🎥 Remote track received:", event.streams[0]);
      };

      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);

      console.log("📡 Sending WebRTC Offer...");
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

      onStartStreaming(newStream);
      socket.emit("start-stream", newStream);
      setShowStreamSetup(false);
      console.log(`📡 Stream started! ID: ${socket.id}`);
    } catch (error) {
      console.error("❌ Streaming Error:", error);
      alert("❌ Failed to access camera/microphone. Please allow permissions.");
    }
  }, [streamTitle, acceptedTerms, category, hashtags, user?.displayName, user?.email, onStartStreaming]);

  const stopStream = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    socket.emit("stop-stream");
    setShowStreamSetup(true);
    console.log("🛑 Stream stopped!");
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

          <button 
            onClick={startStream} 
            disabled={!acceptedTerms} 
            className={acceptedTerms ? "enabled-btn" : "disabled-btn"}
          >
            {videoReady ? "Start Streaming" : "🎥 Start Streaming"}
          </button>
        </div>
      ) : (
        <div>
          <video ref={videoRef} autoPlay playsInline muted className="streamerdash-video" />
          <button className="streamerdash-stop-btn" onClick={stopStream}>🛑 Stop Stream</button>
        </div>
      )}
    </div>
  );
};

export default StreamerDashboard;
