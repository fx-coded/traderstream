/**
 * Helper utilities for the streaming application
 */

/**
 * Generates a unique ID for streams
 * Uses a combination of timestamp, random string, and user-friendly characters
 * Format: traderstream-{timestamp}-{random}
 * @returns {string} Unique stream ID
 */
export const generateUniqueId = () => {
    // Get current timestamp
    const timestamp = Date.now().toString(36);
    
    // Create random component (8 characters)
    const randomStr = Math.random().toString(36).substring(2, 10);
    
    // Combine parts with a prefix
    return `traderstream-${timestamp}-${randomStr}`;
  };
  
  /**
   * Formats a duration in seconds to a human-readable string
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration string (HH:MM:SS)
   */
  export const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };
  
  /**
   * Checks if the current device is mobile
   * @returns {boolean} True if the device is mobile
   */
  export const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };
  
  /**
   * Formats views count with K/M suffixes for large numbers
   * @param {number} count - Number of views
   * @returns {string} Formatted view count
   */
  export const formatViewCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };
  
  /**
   * Creates a shareable URL for a stream
   * @param {string} streamId - The unique ID of the stream
   * @param {string} baseUrl - Optional base URL, defaults to current origin
   * @returns {string} Complete shareable URL
   */
  export const createShareableUrl = (streamId, baseUrl = window.location.origin) => {
    return `${baseUrl}/viewer/${streamId}`;
  };
  
  /**
   * Copy text to clipboard with fallback
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  export const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
      return false;
    }
  };
  
  /**
   * Check WebRTC browser compatibility
   * @returns {boolean} If browser supports WebRTC
   */
  export const isWebRTCSupported = () => {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    );
  };
  
  /**
   * Validates stream title and returns error message if invalid
   * @param {string} title - Stream title to validate
   * @returns {string|null} Error message or null if valid
   */
  export const validateStreamTitle = (title) => {
    if (!title || title.trim() === '') {
      return 'Stream title is required';
    }
    
    if (title.length < 5) {
      return 'Stream title must be at least 5 characters';
    }
    
    if (title.length > 100) {
      return 'Stream title must be less than 100 characters';
    }
    
    return null;
  };
  
  /**
   * Gets optimal video constraints based on device capabilities
   * @returns {Object} Constraints object for getUserMedia
   */
  export const getOptimalVideoConstraints = () => {
    // Default HD constraints
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
    
    // You could extend this to detect device capabilities
    // and adjust constraints accordingly
    
    return constraints;
  };
  
  /**
   * Format time as HH:MM AM/PM
   * @param {Date|string} date - Date object or ISO string
   * @returns {string} Formatted time
   */
  export const formatTime = (date) => {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Create a named object for the default export
  const helpers = {
    generateUniqueId,
    formatDuration,
    isMobileDevice,
    formatViewCount,
    createShareableUrl,
    copyToClipboard,
    isWebRTCSupported,
    validateStreamTitle,
    getOptimalVideoConstraints,
    formatTime
  };
  
  export default helpers;