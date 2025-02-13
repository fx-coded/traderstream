// ManageStream.js
import React, { useState } from "react";

const ManageStream = () => {
  const [isLive, setIsLive] = useState(false);

  const toggleStream = () => {
    // TODO: Send request to backend to start/stop stream
    setIsLive(!isLive);
  };

  return (
    <div>
      <h2>Manage Your Stream</h2>
      <button onClick={toggleStream}>{isLive ? "Stop Streaming" : "Start Streaming"}</button>
    </div>
  );
};

export default ManageStream;