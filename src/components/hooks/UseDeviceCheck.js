import { useState, useEffect } from "react";

/**
 * Custom hook to check if the user's device is supported for streaming
 * 
 * @returns {boolean} - True if device is desktop/laptop with required capabilities, false otherwise
 */
export const useDeviceCheck = () => {
  const [isDeviceAllowed, setIsDeviceAllowed] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    // Check if required browser APIs are available
    const hasRequiredAPIs = 
      typeof navigator.mediaDevices !== 'undefined' && 
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window.RTCPeerConnection === 'function';
    
    // Device is allowed if it's not mobile and has required APIs
    setIsDeviceAllowed(!isMobile && hasRequiredAPIs);
    
    // Optional: Log device check results
    console.log("Device check:", {
      isMobile,
      hasRequiredAPIs,
      isDeviceAllowed: !isMobile && hasRequiredAPIs
    });
  }, []);

  return isDeviceAllowed;
};

export default useDeviceCheck;