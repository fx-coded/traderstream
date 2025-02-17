import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "../styles/LiveStreams.css";

const socket = io("http://localhost:4000");

const LiveStreams = ({ liveStreams, user, setShowAuthModal = () => {} }) => {
  const navigate = useNavigate();
  const [viewerCounts, setViewerCounts] = useState({});

  useEffect(() => {
    socket.on("viewer-count", ({ streamerId, count }) => {
      setViewerCounts((prevCounts) => ({
        ...prevCounts,
        [streamerId]: count,
      }));
    });

    return () => {
      socket.off("viewer-count");
    };
  }, []);

  const handleGoLive = () => {
    if (!user) {
      setShowAuthModal("login"); // 🔐 Require login before streaming
    } else {
      navigate("/go-live"); // 🚀 Redirect to Streamer Dashboard
    }
  };

  return (
    <div className="live-streams-container">
      <h2 className="live-streams-title">🎥 Live Streams</h2>

      <button className="go-live-btn" onClick={handleGoLive}>
        🚀 Go Live
      </button>

      {liveStreams.length === 0 ? (
        <p className="no-streams">🚨 No live streams available.</p>
      ) : (
        <div className="live-stream-grid">
          {liveStreams.map((stream) => (
            <div
              key={stream.id}
              className="live-stream-card"
              onClick={() => navigate(`/viewer/${stream.id}`)}
            >
              <img
                src={stream.thumbnail || "https://via.placeholder.com/320x180.png?text=Live+Stream"}
                alt="Stream Thumbnail"
                className="live-stream-thumbnail"
              />
              <div className="live-stream-info">
                <h3 className="live-stream-title">{stream.title}</h3>
                <p className="live-stream-category">📌 {stream.category}</p>
                <p className="live-stream-viewers">
                  👀 {viewerCounts[stream.id] ?? stream.viewers ?? 0} viewers
                </p>
                <p className="live-stream-user">🎤 {stream.username}</p>
                <p className="live-stream-hashtags">
                  {stream.hashtags?.map((tag, index) => (
                    <span key={index} className="hashtag">#{tag} </span>
                  ))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveStreams;
