// LiveStreamSetup.js
import React, { useState } from "react";

const LiveStreamSetup = () => {
  const [streamKey, setStreamKey] = useState("");
  
  const generateStreamKey = () => {
    // TODO: Fetch from backend API
    setStreamKey("rtmp://yourserver/live/yourstreamkey");
  };

  return (
    <div>
      <h2>Start Streaming</h2>
      <button onClick={generateStreamKey}>Generate Stream Key</button>
      {streamKey && <p>Stream to: {streamKey}</p>}
    </div>
  );
};

export default LiveStreamSetup;