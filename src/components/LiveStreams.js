import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/global.css";

const LiveStreams = ({ setSelectedStreamer, filteredCategory }) => {
  const [displayedStreams, setDisplayedStreams] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Future: Fetch live streams dynamically (e.g., from an API or WebSocket)
    const fetchStreams = async () => {
      // Placeholder for API fetch
      setDisplayedStreams([]); // No hardcoded streams for now
    };

    fetchStreams();
  }, []);

  useEffect(() => {
    if (!filteredCategory) {
      setDisplayedStreams((prevStreams) => prevStreams);
    } else {
      setDisplayedStreams((prevStreams) =>
        prevStreams.filter((stream) => stream.category === filteredCategory)
      );
    }
  }, [filteredCategory]);

  // Limit streams initially (only show 6)
  const initialStreams = displayedStreams.slice(0, 6);

  return (
    <section className="live-streams">
      <h2 className="degen-title"> Live Trading Streams</h2>

      {displayedStreams.length > 0 ? (
        <div className="streams-grid">
          {(showAll ? displayedStreams : initialStreams).map((stream) => (
            <div
              key={stream.id}
              className="stream-card degen-glow"
              onClick={() => setSelectedStreamer(stream)}
            >
              <div className="live-badge">🔴 Live</div>
              <iframe
                src={stream.videoUrl}
                title={stream.name}
                className="stream-video"
                allowFullScreen
              ></iframe>
              <div className="stream-info">
                <h3 className="degen-text">{stream.name}</h3>
                <p>{stream.category}</p>
                <p>👀 {stream.viewers} viewers</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-streams">
          🚀 No live streams available right now.
          <br />
          <button className="go-live-btn" onClick={() => navigate("/go-live")}>
            🎥 Go Live
          </button>
        </div>
      )}

      {displayedStreams.length > 6 && !showAll && (
        <div className="show-all-container">
          <button className="show-all-btn degen-button" onClick={() => setShowAll(true)}>
             Show All Streams
          </button>
        </div>
      )}
    </section>
  );
};

export default LiveStreams;
