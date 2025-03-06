import React from "react";
import { FaExchangeAlt } from "react-icons/fa";

const VideoSection = ({
  videoRef,
  previewRef,
  streamSource,
  displayMode,
  toggleDisplayMode,
  streamError,
  setStreamError
}) => {
  return (
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
      
      {/* Screen Share Container - only shown when screen sharing is enabled */}
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
      
      {/* Display mode toggle button - only shown when both displays are active */}
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
    </div>
  );
};

export default VideoSection;