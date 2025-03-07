import { useState, useEffect } from "react";

/**
 * Enum for device types
 */
const DeviceType = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
};

/**
 * Custom hook to check device support for streaming
 * 
 * @param {Object} [options] - Configuration options for device check
 * @param {boolean} [options.allowTablets=true] - Whether to allow tablet devices
 * @param {number} [options.minScreenWidth=1024] - Minimum screen width for desktop
 * @param {number} [options.minScreenHeight=768] - Minimum screen height for desktop
 * @returns {Object} Device support information
 */
export const useDeviceCheck = (options = {}) => {
  // Default options with user-provided overrides
  const {
    allowTablets = true,
    minScreenWidth = 1024,
    minScreenHeight = 768
  } = options;

  // State to track device support
  const [deviceSupport, setDeviceSupport] = useState({
    isAllowed: false,
    deviceType: null,
    browserSupport: {},
    screenInfo: {}
  });

  useEffect(() => {
    // Detect device type and capabilities
    const checkDeviceSupport = () => {
      // User agent detection with more comprehensive check
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      // Improved mobile/tablet detection
      const mobileRegex = /android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
      
      const tabletRegex = /android|ipad|tablet|playbook|silk/i;
      
      const isMobile = mobileRegex.test(userAgent);
      const isTablet = tabletRegex.test(userAgent);
      
      // Determine device type
      let deviceType = DeviceType.DESKTOP;
      if (isMobile) deviceType = DeviceType.MOBILE;
      else if (isTablet) deviceType = DeviceType.TABLET;

      // Screen size detection
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Browser APIs check
      const browserSupport = {
        mediaDevices: typeof navigator.mediaDevices !== 'undefined',
        getUserMedia: typeof navigator.mediaDevices?.getUserMedia === 'function',
        webRTC: typeof window.RTCPeerConnection === 'function',
        webRTCStats: typeof window.RTCRtpSender?.getCapabilities === 'function',
        canvas: !!window.CanvasRenderingContext2D,
        webGL: (() => {
          try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          } catch (e) {
            return false;
          }
        })()
      };

      // Determine device allowance
      const isDesktopDevice = 
        deviceType === DeviceType.DESKTOP || 
        (allowTablets && deviceType === DeviceType.TABLET);
      
      const hasMinimumScreenSize = 
        screenWidth >= minScreenWidth && 
        screenHeight >= minScreenHeight;
      
      const hasRequiredBrowserAPIs = 
        browserSupport.mediaDevices &&
        browserSupport.getUserMedia &&
        browserSupport.webRTC &&
        browserSupport.canvas &&
        browserSupport.webGL;

      const isAllowed = 
        isDesktopDevice && 
        hasMinimumScreenSize && 
        hasRequiredBrowserAPIs;

      // Update state with comprehensive device information
      setDeviceSupport({
        isAllowed,
        deviceType,
        browserSupport,
        screenInfo: {
          screenWidth,
          screenHeight,
          windowWidth,
          windowHeight
        },
        details: {
          userAgent,
          isDesktopDevice,
          hasMinimumScreenSize,
          hasRequiredBrowserAPIs
        }
      });

      // Detailed logging for debugging
      console.log("Device Check Result:", {
        isAllowed,
        deviceType,
        browserSupport,
        screenInfo: {
          screenWidth,
          screenHeight,
          windowWidth,
          windowHeight
        }
      });
    };

    // Perform initial check
    checkDeviceSupport();

    // Optional: Recheck on resize (debounced)
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkDeviceSupport, 250);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [allowTablets, minScreenWidth, minScreenHeight]);

  return deviceSupport;
};

export default useDeviceCheck;