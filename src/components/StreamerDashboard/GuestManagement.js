import React from "react";
import { FaCopy, FaMicrophone} from "react-icons/fa";

const GuestManagement = ({
  inviteLink,
  copyInviteLink,
  guests,
  selectedGuest,
  acceptGuest,
  removeGuest,
  selectGuest
}) => {
  return (
    <div className="guest-management-panel">
      <div className="panel-header">
        <h3>Guest Management</h3>
        <button className="close-button">✕</button>
      </div>
      
      {/* Invite Link Section */}
      <div className="invite-section">
        <p>Share this link to invite audio guests:</p>
        <div className="invite-link-container">
          <input 
            type="text" 
            value={inviteLink} 
            readOnly 
            onClick={(e) => e.target.select()} 
          />
          <button onClick={copyInviteLink}>
            <FaCopy /> Copy
          </button>
        </div>
      </div>
      
      {/* Guest List Section */}
      <div className="guests-list">
        <h4>Guests ({guests.length})</h4>
        {guests.length > 0 ? (
          <ul>
            {guests.map((guest) => (
              <li key={guest.id} className={`guest-item ${guest.status} ${selectedGuest === guest.id ? 'selected' : ''}`}>
                <div className="guest-info">
                  <FaMicrophone className="guest-icon" />
                  <span>{guest.name}</span>
                  <span className="guest-status">{guest.status}</span>
                </div>
                <div className="guest-actions">
                  {guest.status === "pending" && (
                    <button onClick={() => acceptGuest(guest.id)} className="accept-button">
                      Accept
                    </button>
                  )}
                  {guest.status === "connected" && (
                    <button onClick={() => selectGuest(guest.id)} className="focus-button">
                      {selectedGuest === guest.id ? "Unfocus" : "Focus"}
                    </button>
                  )}
                  <button onClick={() => removeGuest(guest.id)} className="remove-button">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-guests">No guests yet. Share your invite link to bring in guests.</p>
        )}
      </div>
      
      {/* Guest Settings (Optional) */}
      <div className="guest-settings">
        <h4>Guest Settings</h4>
        <div className="setting-item">
          <input 
            type="checkbox" 
            id="auto-accept" 
          />
          <label htmlFor="auto-accept">Auto-accept guests</label>
        </div>
        <div className="setting-item">
          <input 
            type="checkbox" 
            id="mute-guests" 
          />
          <label htmlFor="mute-guests">Mute guests on join</label>
        </div>
      </div>
    </div>
  );
};

export default GuestManagement;