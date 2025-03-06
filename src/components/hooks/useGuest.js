import { useState, useRef, useCallback } from "react";
import { generateUniqueId } from "../utils/helpers";

/**
 * Custom hook to manage guest functionality for streaming
 * 
 * @param {Function} emitEvent - Function to emit socket events
 * @param {string} streamId - The ID of the current stream
 * @returns {Object} Guest management state and functions
 */
export const useGuests = (emitEvent, streamId) => {
  // Guest state
  const [guests, setGuests] = useState([]);
  const [guestMode, setGuestMode] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [selectedGuest, setSelectedGuest] = useState(null);
  
  // Guest connections and audio refs
  const [guestConnections, setGuestConnections] = useState({});
  const guestAudioRefs = useRef({});
  
  /**
   * Generate an invite link for guests
   * 
   * @param {string} currentStreamId - Stream ID to generate the link for
   * @returns {string} - The generated invite link
   */
  const generateInviteLink = useCallback((currentStreamId) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/guest/${currentStreamId}?token=${generateUniqueId()}`;
    setInviteLink(link);
    return link;
  }, []);
  
  /**
   * Toggle guest mode on/off
   */
  const toggleGuestMode = useCallback(() => {
    setGuestMode(prevMode => {
      // Only generate invite link when turning on guest mode
      const newMode = !prevMode;
      if (newMode && streamId) {
        // Use setTimeout to prevent the state update during render
        setTimeout(() => {
          generateInviteLink(streamId);
        }, 0);
      }
      return newMode;
    });
  }, [streamId, generateInviteLink]);
  
  /**
   * Copy invite link to clipboard
   */
  const copyInviteLink = useCallback(() => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          alert("Invite link copied to clipboard!");
        })
        .catch(err => {
          console.error("Failed to copy invite link:", err);
        });
    }
  }, [inviteLink]);
  
  /**
   * Accept a guest request
   * 
   * @param {string} guestId - ID of the guest to accept
   */
  const acceptGuest = useCallback((guestId) => {
    // Find the guest in the list
    const guest = guests.find(g => g.id === guestId);
    
    if (!guest) {
      console.error(`Guest with ID ${guestId} not found`);
      return;
    }
    
    // Update guest status
    setGuests(prev => prev.map(g => 
      g.id === guestId 
        ? { ...g, status: "accepted" } 
        : g
    ));
    
    // Notify server
    emitEvent("accept-guest", {
      streamerId: streamId,
      guestId,
      audioOnly: guest.audioOnly
    });
    
    console.log(`Accepted guest: ${guest.name}`);
  }, [guests, streamId, emitEvent]);
  
  /**
   * Remove a guest from the stream
   * 
   * @param {string} guestId - ID of the guest to remove
   */
  const removeGuest = useCallback((guestId) => {
    // Find the guest
    const guest = guests.find(g => g.id === guestId);
    
    if (!guest) {
      // If guest not found, just clean up any state referencing this ID
      if (selectedGuest === guestId) {
        setSelectedGuest(null);
      }
      return;
    }
    
    // Remove from the guest list
    setGuests(prev => prev.filter(g => g.id !== guestId));
    
    // Clear connection if exists
    if (guestConnections[guestId]) {
      // Close the connection
      try {
        guestConnections[guestId].close();
      } catch (error) {
        console.error(`Error closing guest connection: ${error}`);
      }
      
      // Remove from connections
      setGuestConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[guestId];
        return newConnections;
      });
    }
    
    // Notify server
    emitEvent("remove-guest", {
      streamerId: streamId,
      guestId
    });
    
    // If this was the selected guest, clear selection
    if (selectedGuest === guestId) {
      setSelectedGuest(null);
    }
    
    console.log(`Removed guest: ${guest.name}`);
  }, [guests, streamId, emitEvent, guestConnections, selectedGuest]);
  
  /**
   * Select a guest to feature
   * 
   * @param {string} guestId - ID of the guest to select
   */
  const selectGuest = useCallback((guestId) => {
    // Toggle selection if already selected
    if (selectedGuest === guestId) {
      setSelectedGuest(null);
    } else {
      setSelectedGuest(guestId);
    }
  }, [selectedGuest]);
  
  return {
    guests,
    setGuests,
    guestMode,
    inviteLink,
    selectedGuest,
    guestConnections,
    setGuestConnections,
    guestAudioRefs,
    generateInviteLink,
    acceptGuest,
    removeGuest,
    selectGuest,
    toggleGuestMode,
    copyInviteLink
  };
};

export default useGuests;