import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Custom hook to manage WebRTC connections for streaming
 * 
 * @param {Function} emitEvent - Function to emit socket events
 * @returns {Object} WebRTC connection methods and state
 */
export const useWebRTC = (emitEvent) => {
  // Use ref to store the peer connection instance
  const peerConnectionRef = useRef(null);
  
  // Track if the connection is initialized
  const [isInitialized, setIsInitialized] = useState(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Cleanup the peer connection
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (error) {
          console.error("Error closing peer connection on unmount:", error);
        }
        peerConnectionRef.current = null;
      }
    };
  }, []);

  /**
   * Close and cleanup the peer connection
   */
  const closePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      // Close the connection
      try {
        peerConnectionRef.current.close();
      } catch (error) {
        console.error("Error closing peer connection:", error);
      }
      
      // Clear the reference
      peerConnectionRef.current = null;
      setIsInitialized(false);
    }
  }, []);

  /**
   * Initialize WebRTC peer connection with provided media stream
   * 
   * @param {MediaStream} stream - Media stream to share
   * @param {string} streamId - Unique identifier for the stream
   * @returns {boolean} - Success status
   */
  const initializeWebRTC = useCallback(async (stream, streamId) => {
    try {
      if (!stream) {
        console.error("No media stream provided");
        return false;
      }
      
      // Close any existing peer connection
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (error) {
          console.error("Error closing existing peer connection:", error);
        }
        peerConnectionRef.current = null;
      }
      
      // STUN/TURN servers configuration
      const iceServers = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // Add your TURN servers here if needed for NAT traversal
        ]
      };
      
      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = peerConnection;
      
      // Add all tracks from the stream to the peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Set up ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send the ICE candidate to the server
          emitEvent('ice-candidate', {
            streamerId: streamId,
            candidate: event.candidate
          });
        }
      };
      
      // Monitor connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`WebRTC connection state: ${peerConnection.connectionState}`);
        
        if (peerConnection.connectionState === 'failed' || 
            peerConnection.connectionState === 'disconnected' ||
            peerConnection.connectionState === 'closed') {
          console.warn("WebRTC connection is not active");
        }
      };
      
      // Create offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });
      
      // Set local description
      await peerConnection.setLocalDescription(offer);
      
      // Send the offer to the server
      emitEvent('offer', {
        streamerId: streamId,
        sdp: peerConnection.localDescription
      });
      
      setIsInitialized(true);
      console.log("WebRTC initialized successfully");
      return true;
    } catch (error) {
      console.error("WebRTC initialization error:", error);
      
      // Clean up on error
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (e) {
          console.error("Error closing peer connection after initialization failure:", e);
        }
        peerConnectionRef.current = null;
      }
      
      setIsInitialized(false);
      return false;
    }
  }, [emitEvent]);

  /**
   * Handle an incoming answer from a viewer
   * 
   * @param {RTCSessionDescription} sdp - Session description from viewer
   */
  const handleAnswer = useCallback((sdp) => {
    try {
      if (!peerConnectionRef.current) {
        console.error("No peer connection available");
        return;
      }
      
      // Set remote description from the answer
      peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp))
        .catch(error => {
          console.error("Error setting remote description:", error);
        });
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }, []);

  /**
   * Handle an incoming ICE candidate from a viewer
   * 
   * @param {RTCIceCandidate} candidate - ICE candidate from viewer
   */
  const handleIceCandidate = useCallback((candidate) => {
    try {
      if (!peerConnectionRef.current) {
        console.error("No peer connection available");
        return;
      }
      
      // Add the ICE candidate to the connection
      peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        .catch(error => {
          console.error("Error adding ICE candidate:", error);
        });
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }, []);

  return {
    initializeWebRTC,
    handleAnswer,
    handleIceCandidate,
    closePeerConnection,
    isInitialized
  };
};

export default useWebRTC;