import React, { useState, useRef, useCallback } from "react";
import {
  FaPause,
  FaPlay,
  FaCog,
  FaCompress,
  FaExpand,
  FaVolumeUp,
  FaVolumeDown,
  FaVolumeMute,
  FaVideoSlash,
  FaTh,
  FaMicrophone,
  FaMicrophoneSlash,
  FaCamera,
  FaShare,
  FaCopy,
  FaCircle,
  FaRegStopCircle,
  FaDownload,
  FaUserPlus
} from "react-icons/fa";

/**
 * StreamControls Component
 * 
 * A comprehensive control bar for streaming applications with advanced features:
 * - Play/Pause toggle
 * - Audio mute/unmute
 * - Video enable/disable
 * - Volume control
 * - Layout switching
 * - Fullscreen toggle
 * - Recording controls
 * - Quality settings
 * - Screenshot capture
 * - Sharing options
 */
const StreamControls = ({
  stream,
  videoRef,
  audioEnabled,
  setAudioEnabled,
  takeScreenshot,
  shareStream,
  copyStreamUrl,
  toggleGuestMode,
  guestMode,
  stopStream,
  formatDuration,
  streamDuration,
  containerRef,
  streamTitle
}) => {
  // State for video controls
  const [isPaused, setIsPaused] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [videoQuality, setVideoQuality] = useState("auto");
  const [layoutOption, setLayoutOption] = useState("default");
  
  // State for recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  
  /**
   * Toggle pause/play stream
   */
  const togglePause = useCallback(() => {
    if (!stream) return;
    
    if (isPaused) {
      // Resume all tracks
      stream.getTracks().forEach(track => {
        if (track.kind === 'video') {
          track.enabled = videoEnabled;
        }
      });
    } else {
      // Pause video tracks
      stream.getTracks().forEach(track => {
        if (track.kind === 'video') {
          track.enabled = false;
        }
      });
    }
    
    setIsPaused(!isPaused);
  }, [isPaused, videoEnabled, stream]);

  /**
   * Toggle video on/off
   */
  const toggleVideo = useCallback(() => {
    if (!stream) return;
    
    const newState = !videoEnabled;
    
    // Only toggle if not paused
    if (!isPaused) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
    }
    
    setVideoEnabled(newState);
  }, [videoEnabled, isPaused, stream]);

  /**
   * Toggle audio mute/unmute
   */
  const toggleAudio = useCallback(() => {
    if (!stream) return;
    
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      const enabled = !audioTracks[0].enabled;
      audioTracks.forEach(track => {
        track.enabled = enabled;
      });
      setAudioEnabled(enabled);
    }
  }, [stream, setAudioEnabled]);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(() => {
    if (!containerRef?.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  }, [containerRef]);

  /**
   * Handle volume change
   */
  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    
    // Apply to video element if available
    if (videoRef?.current && videoRef.current.volume !== undefined) {
      videoRef.current.volume = newVolume / 100;
    }
  }, [videoRef]);

  /**
   * Toggle settings panel
   */
  const toggleSettings = useCallback(() => {
    setShowSettings(!showSettings);
  }, [showSettings]);

  /**
   * Change video quality
   */
  const changeVideoQuality = useCallback((quality) => {
    setVideoQuality(quality);
    // In a real implementation, you would renegotiate the WebRTC connection
    console.log(`Quality changed to ${quality}`);
    setShowSettings(false);
  }, []);

  /**
   * Change layout option
   */
  const changeLayout = useCallback(() => {
    setLayoutOption(current => {
      if (current === "default") return "pip";
      if (current === "pip") return "grid";
      if (current === "grid") return "cinema";
      return "default";
    });
    
    // Apply layout class to parent container
    if (containerRef?.current) {
      const parent = containerRef.current.parentElement;
      if (parent) {
        // Remove all previous layout classes
        parent.classList.remove(
          'layout-default', 
          'layout-pip', 
          'layout-grid', 
          'layout-cinema'
        );
        
        // Add new layout class based on next state
        const nextLayout = layoutOption === "default" ? "pip" : 
                          layoutOption === "pip" ? "grid" :
                          layoutOption === "grid" ? "cinema" : "default";
        
        parent.classList.add(`layout-${nextLayout}`);
        
        // For cinema mode, toggle body class
        if (nextLayout === "cinema") {
          document.body.classList.add('cinema-mode');
        } else if (layoutOption === "cinema") {
          document.body.classList.remove('cinema-mode');
        }
      }
    }
  }, [layoutOption, containerRef]);

  /**
   * Start recording
   */
  const startRecording = useCallback(() => {
    if (!stream || isRecording) return;
    
    try {
      // Try to use higher quality codec if available
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      let recorder;
      
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.log('MediaRecorder with vp9 not supported, trying vp8');
        options.mimeType = 'video/webm;codecs=vp8,opus';
        try {
          recorder = new MediaRecorder(stream, options);
        } catch (e) {
          console.log('MediaRecorder with vp8 not supported, trying default');
          recorder = new MediaRecorder(stream);
        }
      }
      
      // Set up data handler
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };
      
      // Start the recorder
      recorder.start(1000); // Collect data every second
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordedChunks([]);
      
      // Set up recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      console.log("Recording started!");
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Your browser may not support this feature.");
    }
  }, [stream, isRecording]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    
    // Stop the recorder
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    
    // Stop the timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    console.log("Recording stopped!");
  }, []);

  /**
   * Download recording
   */
  const downloadRecording = useCallback(() => {
    if (recordedChunks.length === 0) return;
    
    // Create a blob from the recorded chunks
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${streamTitle ? streamTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'stream'}-${new Date().toISOString().substring(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    // Reset recorded chunks and time
    setRecordedChunks([]);
    setRecordingTime(0);
  }, [recordedChunks, streamTitle]);

  /**
   * Format recording time as MM:SS
   */
  const formatRecordingTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  return (
    <div className="enhanced-stream-controls">
      <div className="left-controls">
        <button 
          className="control-button" 
          onClick={togglePause}
          title={isPaused ? "Resume Stream" : "Pause Stream"}
        >
          {isPaused ? <FaPlay /> : <FaPause />}
        </button>
        
        <button 
          className="control-button" 
          onClick={toggleVideo}
          title={videoEnabled ? "Disable Video" : "Enable Video"}
        >
          {videoEnabled ? <FaCamera /> : <FaVideoSlash />}
        </button>
        
        <button 
          className="control-button" 
          onClick={toggleAudio}
          title={audioEnabled ? "Mute Audio" : "Unmute Audio"}
        >
          {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        
        <div className="volume-control">
          {volume === 0 ? (
            <FaVolumeMute className="volume-icon" />
          ) : volume < 50 ? (
            <FaVolumeDown className="volume-icon" />
          ) : (
            <FaVolumeUp className="volume-icon" />
          )}
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            aria-label="Volume Control"
          />
        </div>
      </div>
      
      <div className="center-controls">
        {isRecording ? (
          <div className="recording-timer">
            <div className="recording-indicator"></div>
            <span>REC {formatRecordingTime(recordingTime)}</span>
          </div>
        ) : (
          <div className="stream-duration">
            {formatDuration(streamDuration)}
          </div>
        )}
      </div>
      
      <div className="right-controls">
        {!isRecording && recordedChunks.length === 0 && (
          <button 
            className="control-button rec-button" 
            onClick={startRecording}
            title="Start Recording"
          >
            <FaCircle />
          </button>
        )}
        
        {isRecording && (
          <button 
            className="control-button stop-rec-button" 
            onClick={stopRecording}
            title="Stop Recording"
          >
            <FaRegStopCircle />
          </button>
        )}
        
        {!isRecording && recordedChunks.length > 0 && (
          <button 
            className="control-button download-button" 
            onClick={downloadRecording}
            title="Download Recording"
          >
            <FaDownload />
          </button>
        )}
        
        <button 
          className="control-button" 
          onClick={changeLayout}
          title="Change Layout"
        >
          <FaTh />
        </button>
        
        <button 
          className="control-button" 
          onClick={takeScreenshot}
          title="Take Screenshot"
        >
          <FaCamera />
        </button>
        
        <button 
          className="control-button" 
          onClick={copyStreamUrl}
          title="Copy Stream URL"
        >
          <FaCopy />
        </button>
        
        <button 
          className="control-button" 
          onClick={shareStream}
          title="Share Stream"
        >
          <FaShare />
        </button>
        
        <button 
          className={`control-button ${guestMode ? "active" : ""}`} 
          onClick={toggleGuestMode}
          title={guestMode ? "Hide Guest Panel" : "Show Guest Panel"}
        >
          <FaUserPlus />
        </button>
        
        <button 
          className="control-button" 
          onClick={toggleSettings}
          title="Stream Settings"
        >
          <FaCog />
        </button>
        
        <button 
          className="control-button" 
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </button>
        
        <button 
          className="control-button stop-button" 
          onClick={stopStream}
          title="Stop Streaming"
        >
          Stop Stream
        </button>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h4>Stream Settings</h4>
            <button onClick={toggleSettings} className="close-settings">✕</button>
          </div>
          
          <div className="settings-section">
            <h5>Video Quality</h5>
            <div className="quality-options">
              {["auto", "high", "medium", "low"].map(quality => (
                <button
                  key={quality}
                  className={`quality-option ${videoQuality === quality ? "active" : ""}`}
                  onClick={() => changeVideoQuality(quality)}
                >
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h5>Layout</h5>
            <div className="quality-options">
              {["default", "pip", "grid", "cinema"].map(layout => (
                <button
                  key={layout}
                  className={`quality-option ${layoutOption === layout ? "active" : ""}`}
                  onClick={() => {
                    setLayoutOption(layout);
                    if (containerRef?.current) {
                      const parent = containerRef.current.parentElement;
                      if (parent) {
                        parent.classList.remove(
                          'layout-default', 
                          'layout-pip', 
                          'layout-grid', 
                          'layout-cinema'
                        );
                        parent.classList.add(`layout-${layout}`);
                        
                        if (layout === "cinema") {
                          document.body.classList.add('cinema-mode');
                        } else {
                          document.body.classList.remove('cinema-mode');
                        }
                      }
                    }
                  }}
                >
                  {layout.charAt(0).toUpperCase() + layout.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h5>Stream Info</h5>
            <p><strong>Duration:</strong> {formatDuration(streamDuration)}</p>
            {isRecording && (
              <p><strong>Recording:</strong> {formatRecordingTime(recordingTime)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamControls;