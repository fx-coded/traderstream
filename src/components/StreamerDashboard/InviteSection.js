import React from "react";
import { FaCopy, FaLink, FaShare } from "react-icons/fa";

const InviteSection = ({
  inviteLink,
  copyInviteLink
}) => {
  // Function to share invite link using Web Share API if available
  const shareInviteLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join my trading stream as a guest',
        text: 'Click this link to join my live trading stream as a guest',
        url: inviteLink
      }).catch(err => {
        console.error('Error sharing invite link:', err);
      });
    } else {
      // Fallback to copy if share API is not available
      copyInviteLink();
    }
  };

  return (
    <div className="invite-section">
      <div className="section-header">
        <FaLink className="section-icon" />
        <h4>Invite Guests</h4>
      </div>
      
      <p className="invite-instructions">
        Share this link to invite audio guests to your stream:
      </p>
      
      <div className="invite-link-container">
        <input 
          type="text" 
          value={inviteLink} 
          readOnly 
          className="invite-link-input"
          onClick={(e) => e.target.select()} 
          aria-label="Guest invite link"
        />
        
        <div className="invite-actions">
          <button 
            onClick={copyInviteLink} 
            className="invite-action-button copy-button"
            title="Copy to clipboard"
          >
            <FaCopy /> Copy
          </button>
          
          {navigator.share && (
            <button 
              onClick={shareInviteLink} 
              className="invite-action-button share-button"
              title="Share invite link"
            >
              <FaShare /> Share
            </button>
          )}
        </div>
      </div>
      
      <div className="invite-note">
        <p>Guests will be able to join with audio only and must be approved by you.</p>
      </div>
    </div>
  );
};

export default InviteSection;