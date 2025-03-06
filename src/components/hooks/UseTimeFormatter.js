import { useCallback } from "react";

/**
 * Custom hook that provides a function to format seconds into a human-readable time string
 * 
 * @returns {Function} - Formatter function that converts seconds to HH:MM:SS format
 */
export const useTimeFormatter = () => {
  /**
   * Formats seconds into a human-readable time string (HH:MM:SS)
   * 
   * @param {number} seconds - Number of seconds to format
   * @returns {string} - Formatted time string
   */
  const formatDuration = useCallback((seconds) => {
    if (!seconds && seconds !== 0) return "00:00:00";
    
    // Calculate hours, minutes, seconds
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    // Format with leading zeros
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    
    // Return formatted time string
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }, []);

  return formatDuration;
};

export default useTimeFormatter;