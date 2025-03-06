import React from "react";
import { FaVideo, FaDesktop, FaCheck } from "react-icons/fa";

const SourceSelector = ({
  streamSource,
  setStreamSource,
  screenWithAudio,
  setScreenWithAudio
}) => {
  return (
    <div className="source-selector">
      <div className="source-section">
        <h3>Stream Source</h3>
        <div className="source-options">
          {/* Camera option */}
          <div 
            className={`source-option ${streamSource === "camera" ? "selected" : ""}`}
            onClick={() => setStreamSource("camera")}
          >
            <FaVideo className="source-icon" />
            <span>Camera</span>
            {streamSource === "camera" && <div className="selection-indicator"><FaCheck /></div>}
          </div>
          
          {/* Screen option */}
          <div 
            className={`source-option ${streamSource === "screen" ? "selected" : ""}`}
            onClick={() => setStreamSource("screen")}
          >
            <FaDesktop className="source-icon" />
            <span>Screen</span>
            {streamSource === "screen" && <div className="selection-indicator"><FaCheck /></div>}
          </div>
          
          {/* Both option */}
          <div 
            className={`source-option ${streamSource === "both" ? "selected" : ""}`}
            onClick={() => setStreamSource("both")}
          >
            <span className="combined-icon">
              <FaDesktop className="source-icon" />
              <FaVideo className="source-icon" />
            </span>
            <span>Both</span>
            {streamSource === "both" && <div className="selection-indicator"><FaCheck /></div>}
          </div>
        </div>
      </div>

      {/* Screen audio option - only shown when screen sharing is enabled */}
      {(streamSource === "screen" || streamSource === "both") && (
        <div className="form-group inline-checkbox">
          <input
            type="checkbox"
            id="screen-audio"
            checked={screenWithAudio}
            onChange={() => setScreenWithAudio(!screenWithAudio)}
          />
          <label htmlFor="screen-audio">Include audio from screen share</label>
        </div>
      )}
    </div>
  );
};

export default SourceSelector;