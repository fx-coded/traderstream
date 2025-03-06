import React from "react";
import { FaStar, FaVolumeMute, FaVolumeUp, FaCrown, FaUserTimes } from "react-icons/fa";

const GuestControls = ({
  guest,
  isSelected,
  onAccept,
  onRemove,
  onSelect,
  onMute
}) => {
  const { id, status, name, hasAudio, muted } = guest;
  
  return (
    <div className="guest-controls">
      {/* Different controls based on guest status */}
      {status === "pending" && (
        <div className="pending-controls">
          <button 
            onClick={() => onAccept(id)} 
            className="control-button accept-button"
            title={`Accept ${name} to join stream`}
          >
            <FaCrown className="button-icon" />
            <span className="button-text">Accept</span>
          </button>
          
          <button 
            onClick={() => onRemove(id)} 
            className="control-button reject-button"
            title={`Reject ${name}'s request to join`}
          >
            <FaUserTimes className="button-icon" />
            <span className="button-text">Reject</span>
          </button>
        </div>
      )}
      
      {status === "connected" && (
        <div className="connected-controls">
          {/* Focus/highlight button */}
          <button 
            onClick={() => onSelect(id)} 
            className={`control-button focus-button ${isSelected ? 'active' : ''}`}
            title={isSelected ? `Remove focus from ${name}` : `Focus on ${name}`}
          >
            <FaStar className="button-icon" />
            <span className="button-text">{isSelected ? "Unfocus" : "Focus"}</span>
          </button>
          
          {/* Mute button - only shown if guest has audio */}
          {hasAudio && (
            <button 
              onClick={() => onMute(id, !muted)} 
              className={`control-button mute-button ${muted ? 'muted' : ''}`}
              title={muted ? `Unmute ${name}` : `Mute ${name}`}
            >
              {muted ? <FaVolumeMute className="button-icon" /> : <FaVolumeUp className="button-icon" />}
              <span className="button-text">{muted ? "Unmute" : "Mute"}</span>
            </button>
          )}
          
          {/* Remove button */}
          <button 
            onClick={() => onRemove(id)} 
            className="control-button remove-button"
            title={`Remove ${name} from stream`}
          >
            <FaUserTimes className="button-icon" />
            <span className="button-text">Remove</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default GuestControls;