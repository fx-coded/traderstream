import React, { useState, useEffect } from "react";
import "../styles/global.css";

const LiveStreams = ({ setSelectedStreamer, filteredCategories = [] }) => {
  const [displayedStreams, setDisplayedStreams] = useState([]);

  useEffect(() => {
    // Fetch live streams from an API (or WebSocket in the future)
    // Simulating an API fetch with an empty result for now
    const fetchStreams = async () => {
      const response = []; // Simulating an empty API response
      setDisplayedStreams(response);
    };

    fetchStreams();
  }, []);

  useEffect(() => {
    if (!Array.isArray(filteredCategories) || filteredCategories.length === 0) {
      setDisplayedStreams([]);
    } else {
      setDisplayedStreams([]); // Filtering logic should go here when API is available
    }
  }, [filteredCategories]);

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
              <iframe src={stream.videoUrl} title={stream.name} className="stream-video" allowFullScreen></iframe>
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
          🚀 No live streams available right now. Be the first to go live!
        </div>
      )}

      {displayedStreams.length > streamsPerPage && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>◀ Prev</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>Next ▶</button>
        </div>
      )}
    </section>
  );
};

export default LiveStreams;
