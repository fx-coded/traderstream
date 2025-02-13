import React, { useState } from "react";
import "../styles/global.css";

const TrendingStreams = ({ setSelectedStreamer }) => {
  // Set trending streams to an empty array to simulate no streams available
  const trending = []; // No streams available initially

  const streamsPerPage = 6; // Number of streams per page
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(trending.length / streamsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const displayedStreams = trending.slice(
    (currentPage - 1) * streamsPerPage,
    currentPage * streamsPerPage
  );

  return (
    <section className="trending-streams">
      <h2>🚀 Trending Streams</h2>

      {/* Show message if there are no trending streams */}
      {trending.length === 0 ? (
        <div className="no-trending-streams">
          😞 No trending streams available. <br /> 
          Check back later or start streaming!
        </div>
      ) : (
        <div className="streams-grid">
          {displayedStreams.map((stream) => (
            <div
              key={stream.id}
              className="stream-card trending"
              onClick={() => setSelectedStreamer(stream)}
            >
              <img src={stream.thumbnail} alt={stream.name} className="stream-thumbnail" />
              <div className="stream-info">
                <h3>{stream.name}</h3>
                <p>{stream.category}</p>
                <p>👀 {stream.viewers} viewers</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && trending.length > 0 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
            ◀ Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
            Next ▶
          </button>
        </div>
      )}
    </section>
  );
};

export default TrendingStreams;
