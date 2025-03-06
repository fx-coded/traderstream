import React from "react";

const MainVideoDisplay = ({
  videoRef,
  displayMode,
  streamError,
  setStreamError
}) => {
  return (
    <div className={`video-container ${displayMode === "screenLarge" ? "secondary" : "primary"}`}>
      {/* Camera video element */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="stream-video" 
      />
      
      {/* Error overlay - displayed when there's a streaming error */}
      {streamError && (
        <div className="stream-error-overlay">
          <span>{streamError}</span>
          <button onClick={() => setStreamError(null)}>✕</button>
        </div>
      )}
      
      {/* Video label */}
      <div className="video-label">Camera Feed</div>
    </div>
  );
};

export default MainVideoDisplay;