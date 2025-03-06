import React from "react";
import { FaComments, FaUsers, FaChevronUp, FaChevronDown } from "react-icons/fa";

const ChatHeader = ({
  viewerCount,
  isCollapsed,
  toggleCollapse
}) => {
  return (
    <div className="chat-header">
      {/* Chat icon and title */}
      <div className="header-title">
        <FaComments className="header-icon" />
        <h3>Live Chat</h3>
      </div>
      
      {/* Viewer count indicator */}
      <div className="viewer-count">
        <FaUsers className="viewer-icon" />
        <span>{viewerCount} watching</span>
      </div>
      
      {/* Optional: Collapse/expand button */}
      <button 
        className="collapse-button"
        onClick={toggleCollapse}
        aria-label={isCollapsed ? "Expand chat" : "Collapse chat"}
        title={isCollapsed ? "Expand chat" : "Collapse chat"}
      >
        {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
      </button>
    </div>
  );
};

export default ChatHeader;