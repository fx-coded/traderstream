import React, { useState, useRef } from "react";
import { FaExchangeAlt } from "react-icons/fa";

// Import components
import GuestManagement from "./GuestManagement";
import ChatPanel from "./ChatPanel";

const StreamContent = ({
  streamSource,
  streamError,
  setStreamError,
  guestMode,
  inviteLink,
  copyInviteLink,
  guests,
  selectedGuest,
  acceptGuest,
  removeGuest,
  selectGuest,
  chatMessages,
  newMessage,
  setNewMessage,
  sendChatMessage,
  chatContainerRef
}) => {
  // Local state for display mode
  const [displayMode, setDisplayMode] = useState("default"); // default, videoLarge, screenLarge
  
  // Refs for video elements
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  
  // Toggle display mode
  const toggleDisplayMode = () => {
    setDisplayMode(prevMode => {
      if (prevMode === "default") return "videoLarge";
      if (prevMode === "videoLarge") return "screenLarge";
      return "default";
    });
  };
  
  return (
    <div className="stream-content">
      {/* Video display section */}
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
        
        {/* Screen Share Container */}
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
        
        {/* Display mode toggle button */}
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

      {/* Right panel for guest management and chat */}
      <div className="right-panel">
        {/* Guest management panel */}
        {guestMode && (
          <GuestManagement
            inviteLink={inviteLink}
            copyInviteLink={copyInviteLink}
            guests={guests}
            selectedGuest={selectedGuest}
            acceptGuest={acceptGuest}
            removeGuest={removeGuest}
            selectGuest={selectGuest}
          />
        )}

        {/* Chat panel */}
        <ChatPanel
          chatMessages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendChatMessage={sendChatMessage}
          chatContainerRef={chatContainerRef}
        />
      </div>
    </div>
  );
};

export default StreamContent;