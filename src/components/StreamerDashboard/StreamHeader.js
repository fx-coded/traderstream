import React from "react";
import { FaUserFriends, FaRegClock } from "react-icons/fa";

const StreamHeader = ({
  streamTitle,
  category,
  username,
  userAvatar,
  viewerCount,
  streamDuration,
  formatDuration
}) => {
  return (
    <div className="stream-header">
      {/* Streamer info section */}
      <div className="stream-info">
        <img 
          src={userAvatar || "https://via.placeholder.com/40"} 
          alt={username} 
          className="streamer-avatar" 
        />
        <div className="stream-text-info">
          <h2>{streamTitle}</h2>
          <p>
            {username}
            <span className="category-badge">{category}</span>
          </p>
        </div>
      </div>
      
      {/* Stats section */}
      <div className="stream-stats">
        <div className="stat-item">
          <FaUserFriends className="stat-icon" />
          <span className="stat-value">{viewerCount}</span>
          <span className="stat-label">viewers</span>
        </div>
        <div className="stat-item">
          <FaRegClock className="stat-icon" />
          <span className="stat-value">{formatDuration(streamDuration)}</span>
          <span className="stat-label">duration</span>
        </div>
      </div>
    </div>
  );
};

export default StreamHeader;