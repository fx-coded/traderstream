import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to handle media stream capture and management for streaming
 * 
 * @returns {Object} Stream state and control functions
 */
export const useMediaStream = () => {
  // Stream configuration state
  const [streamSource, setStreamSource] = useState("camera"); // "camera", "screen", or "both"
  const [screenWithAudio, setScreenWithAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Stream state
  const [mediaStream, setMediaStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Stop and cleanup all streams
  const stopStream = useCallback(() => {
    if (!mediaStream) return;
    
    // Handle the case where we stored original streams
    if (mediaStream.cameraStream) {
      mediaStream.cameraStream.getTracks().forEach(track => track.stop());
    }
    
    if (mediaStream.screenStream) {
      mediaStream.screenStream.getTracks().forEach(track => track.stop());
    }
    
    // Stop all tracks in the main stream
    mediaStream.getTracks().forEach(track => track.stop());
    
    setMediaStream(null);
  }, [mediaStream]);

  // Cleanup media stream when component unmounts
  useEffect(() => {
    return () => {
      if (mediaStream) {
        stopStream();
      }
    };
  }, [mediaStream, stopStream]);

  // Helper to get camera/microphone stream
  const getCameraStream = useCallback(async () => {
    try {
      const constraints = {
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      };
      
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      throw new Error(`Camera stream error: ${err.message}`);
    }
  }, []);
  
  // Helper to get screen share stream
  const getScreenStream = useCallback(async () => {
    try {
      const constraints = {
        video: {
          cursor: "always"
        },
        audio: screenWithAudio
      };
      
      return await navigator.mediaDevices.getDisplayMedia(constraints);
    } catch (err) {
      throw new Error(`Screen capture error: ${err.message}`);
    }
  }, [screenWithAudio]);
  
  // Main function to get the appropriate stream based on selected source
  const getStream = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Stop any existing stream
      if (mediaStream) {
        stopStream();
      }
      
      let stream;
      
      // Get the appropriate stream based on source
      if (streamSource === "camera") {
        stream = await getCameraStream();
      } else if (streamSource === "screen") {
        stream = await getScreenStream();
      } else if (streamSource === "both") {
        // For "both", we need to combine camera and screen streams
        const cameraStream = await getCameraStream();
        const screenStream = await getScreenStream();
        
        // Combine tracks from both streams
        const combinedTracks = [
          ...screenStream.getVideoTracks(),
          ...cameraStream.getAudioTracks()
        ];
        
        stream = new MediaStream(combinedTracks);
        
        // Store the original streams to properly clean up later
        stream.cameraStream = cameraStream;
        stream.screenStream = screenStream;
      }
      
      // Apply initial audio state
      if (stream && stream.getAudioTracks().length > 0) {
        stream.getAudioTracks().forEach(track => {
          track.enabled = audioEnabled;
        });
      }
      
      setMediaStream(stream);
      setIsLoading(false);
      return stream;
    } catch (err) {
      console.error("Media stream error:", err);
      setError(err.message || "Failed to access media devices");
      setIsLoading(false);
      return null;
    }
  }, [streamSource,  audioEnabled, getCameraStream, getScreenStream, mediaStream, stopStream]);
  
  // Toggle audio on/off
  const toggleAudio = useCallback(() => {
    if (mediaStream) {
      const audioTracks = mediaStream.getAudioTracks();
      
      if (audioTracks.length > 0) {
        const newState = !audioEnabled;
        audioTracks.forEach(track => {
          track.enabled = newState;
        });
        setAudioEnabled(newState);
      }
    }
  }, [mediaStream, audioEnabled]);
  
  return {
    streamSource,
    setStreamSource,
    screenWithAudio,
    setScreenWithAudio,
    audioEnabled,
    mediaStream,
    error,
    isLoading,
    getStream,
    toggleAudio,
    stopStream
  };
};

export default useMediaStream;