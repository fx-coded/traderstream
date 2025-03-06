import React from "react";
import { FaExchangeAlt, FaTh, FaThLarge } from "react-icons/fa";

const LayoutControls = ({
  displayMode,
  toggleDisplayMode,
  streamSource
}) => {
  // Only show layout controls when multiple streams are available
  if (streamSource !== "both" && streamSource !== "screen") {
    return null;
  }

  return (
    <div className="layout-controls">
      {/* Display mode toggle button */}
      <button 
        className="display-mode-toggle" 
        onClick={toggleDisplayMode}
        title="Change Layout"
      >
        <FaExchangeAlt className="icon-rotate" />
        <span className="control-label">Switch Layout</span>
      </button>
      
      {/* Optional: Specific layout buttons */}
      <div className="layout-options">
        <button 
          className={`layout-button ${displayMode === "default" ? "active" : ""}`}
          onClick={() => toggleDisplayMode("default")}
          title="Default Layout"
        >
          <FaTh />
        </button>
        <button 
          className={`layout-button ${displayMode === "videoLarge" ? "active" : ""}`}
          onClick={() => toggleDisplayMode("videoLarge")}
          title="Camera Large"
        >
          <FaThLarge />
        </button>
        <button 
          className={`layout-button ${displayMode === "screenLarge" ? "active" : ""}`}
          onClick={() => toggleDisplayMode("screenLarge")}
          title="Screen Large"
        >
          <FaThLarge className="flipped" />
        </button>
      </div>
    </div>
  );
};

export default LayoutControls;