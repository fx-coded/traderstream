import React from "react";
import { FaMicrophone, FaMicrophoneSlash, FaUser } from "react-icons/fa";

const GuestList = ({
  guests,
  selectedGuest,
  acceptGuest,
  removeGuest,
  selectGuest
}) => {
  return (
    <div className="guests-list">
      <div className="section-header">
        <h4>Guests ({guests.length})</h4>
      </div>
      
      {guests.length > 0 ? (
        <ul className="guest-list">
          {guests.map((guest) => (
            <li key={guest.id} className={`guest-item ${guest.status} ${selectedGuest === guest.id ? 'selected' : ''}`}>
              <div className="guest-info">
                {/* Guest icon based on status and audio state */}
                {guest.status === "connected" ? (
                  guest.hasAudio ? <FaMicrophone className="guest-icon" /> : <FaMicrophoneSlash className="guest-icon" />
                ) : (
                  <FaUser className="guest-icon" />
                )}
                
                {/* Guest name */}
                <span className="guest-name">{guest.name}</span>
                
                {/* Status badge */}
                <span className="guest-status-badge">{guest.status}</span>
              </div>
              
              <div className="guest-actions">
                {/* Action buttons based on guest status */}
                {guest.status === "pending" && (
                  <>
                    <button 
                      onClick={() => acceptGuest(guest.id)} 
                      className="action-button accept-button"
                      title="Allow guest to join stream"
                    >
                      Accept
                    </button>
                  </>
                )}
                
                {guest.status === "connected" && (
                  <button 
                    onClick={() => selectGuest(guest.id)} 
                    className="action-button focus-button"
                    title={selectedGuest === guest.id ? "Remove focus from guest" : "Focus on this guest"}
                  >
                    {selectedGuest === guest.id ? "Unfocus" : "Focus"}
                  </button>
                )}
                
                {/* Remove button available for all guests */}
                <button 
                  onClick={() => removeGuest(guest.id)} 
                  className="action-button remove-button"
                  title="Remove guest from stream"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-guests">
          <p>No guests yet. Share your invite link to bring in guests.</p>
        </div>
      )}
    </div>
  );
};

export default GuestList;