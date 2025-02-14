import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/global.css";

const LiveStreams = ({ setSelectedStreamer, filteredCategory }) => {
  const [displayedStreams, setDisplayedStreams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Future: Fetch live streams dynamically (e.g., from an API or WebSocket)
    const fetchStreams = async () => {
      // Placeholder for API fetch
      setDisplayedStreams([]); // No hardcoded streams
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

  const streamsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(Math.ceil(displayedStreams.length / streamsPerPage), 1);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const paginatedStreams = displayedStreams.slice(
    (currentPage - 1) * streamsPerPage,
    currentPage * streamsPerPage
  );

  return (
    <section className="live-streams">
      <h2>🎥 Live Trading Streams</h2>

      {paginatedStreams.length > 0 ? (
        <div className="streams-grid">
          {paginatedStreams.map((stream) => (
            <div key={stream.id} className="stream-card" onClick={() => setSelectedStreamer(stream)}>
              <div className="live-badge">🔴 Live</div>
              <iframe
                src={stream.videoUrl}
                title={stream.name}
                className="stream-video"
                allowFullScreen
              ></iframe>
              <div className="stream-info">
                <h3>{stream.name}</h3>
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

      {displayedStreams.length > streamsPerPage && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
            ◀ Prev
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
            Next ▶
          </button>
        </div>
      )}
    </section>
  );
};

export default LiveStreams;
