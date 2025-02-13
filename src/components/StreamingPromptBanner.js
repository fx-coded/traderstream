import React from "react";
import "../styles/global.css";

const StreamingPromptBanner = ({ onStartStreaming }) => {
  return (
    <div className="streaming-banner">
      <h2>🚀 Start Streaming & Grow Your Trading Community!</h2>
      <button onClick={onStartStreaming}>🎥 Start Streaming</button>
    </div>
  );
};

export default StreamingPromptBanner;
