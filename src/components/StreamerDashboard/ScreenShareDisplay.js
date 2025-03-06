import React from "react";

const ScreenShareDisplay = ({
  previewRef,
  displayMode
}) => {
  return (
    <div className={`screen-container ${displayMode === "videoLarge" ? "secondary" : "primary"}`}>
      {/* Screen share video element */}
      <video 
        ref={previewRef} 
        autoPlay 
        playsInline 
        muted 
        className="screen-video" 
      />
      
      {/* Video label */}
      <div className="video-label">Screen Share</div>
      
      {/* Optional: Status indicator */}
      <div className="screen-share-status">
        <span className="status-indicator active"></span>
        <span className="status-text">Live</span>
      </div>
    </div>
  );
};

export default ScreenShareDisplay;