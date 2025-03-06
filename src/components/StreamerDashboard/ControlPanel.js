import React from 'react';

const ControlPanel = ({
  audioEnabled,
  toggleAudio,
  guestMode,
  toggleGuestMode,
  takeScreenshot,
  copyStreamUrl,
  shareStream,
  shareUrl,
  stopStream,
  isFullscreen,
  toggleFullscreen
}) => {
  return (
    <div className="control-panel">
      {/* Audio toggle button */}
      <button 
        onClick={toggleAudio}
        className={`control-btn ${audioEnabled ? 'active' : ''}`}
      >
        {audioEnabled ? 'Mute Audio' : 'Unmute Audio'}
      </button>
      
      {/* Guest mode toggle */}
      <button 
        onClick={toggleGuestMode}
        className={`control-btn ${guestMode ? 'active' : ''}`}
      >
        {guestMode ? 'Disable Guest Mode' : 'Enable Guest Mode'}
      </button>
      
      {/* Screenshot button */}
      <button onClick={takeScreenshot} className="control-btn">
        Take Screenshot
      </button>
      
      {/* Copy URL button */}
      <button onClick={copyStreamUrl} className="control-btn">
        Copy Stream URL
      </button>
      
      {/* Share button */}
      <button onClick={shareStream} className="control-btn">
        Share Stream
      </button>
      
      {/* Fullscreen toggle button */}
      <button 
        onClick={toggleFullscreen} 
        className="control-btn"
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
      
      {/* Stop streaming button */}
      <button onClick={stopStream} className="control-btn stop-btn">
        End Stream
      </button>
    </div>
  );
};

export default ControlPanel;