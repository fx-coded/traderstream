import React from "react";
import { FaVideo, FaDesktop, FaCheck } from "react-icons/fa";

// Import constants
import { STREAM_CATEGORIES } from "../utils/constants";

const StreamSetup = ({
  streamTitle,
  setStreamTitle,
  category,
  setCategory,
  description,
  setDescription,
  streamSource,
  setStreamSource,
  screenWithAudio,
  setScreenWithAudio,
  acceptedTerms,
  setAcceptedTerms,
  isLoading,
  socketConnected,
  streamError,
  setStreamError,
  startStream
}) => {
  return (
    <div className="stream-setup modern-ui">
      <div className="setup-header">
        <h2>START YOUR STREAM</h2>
        <p>Quick and simple streaming setup</p>
      </div>

      {/* Display error message if any */}
      {streamError && (
        <div className="stream-error-message">
          <span>{streamError}</span>
          <button onClick={() => setStreamError(null)}>✕</button>
        </div>
      )}

      <div className="setup-form">
        {/* Stream title input */}
        <div className="form-group">
          <label htmlFor="stream-title">Stream Title*</label>
          <input
            id="stream-title"
            type="text"
            placeholder="Enter a title for your stream"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Stream category selection */}
        <div className="form-group">
          <label htmlFor="stream-category">Category*</label>
          <select 
            id="stream-category"
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
          >
            {STREAM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Stream description textarea */}
        <div className="form-group">
          <label htmlFor="stream-description">Description</label>
          <textarea
            id="stream-description"
            placeholder="Describe what your stream is about..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={500}
          ></textarea>
          <div className="char-count">{description.length}/500</div>
        </div>

        {/* Stream source selection */}
        <div className="source-section">
          <h3>Stream Source</h3>
          <div className="source-options">
            <div 
              className={`source-option ${streamSource === "camera" ? "selected" : ""}`}
              onClick={() => setStreamSource("camera")}
            >
              <FaVideo className="source-icon" />
              <span>Camera</span>
              {streamSource === "camera" && <div className="selection-indicator"><FaCheck /></div>}
            </div>
            <div 
              className={`source-option ${streamSource === "screen" ? "selected" : ""}`}
              onClick={() => setStreamSource("screen")}
            >
              <FaDesktop className="source-icon" />
              <span>Screen</span>
              {streamSource === "screen" && <div className="selection-indicator"><FaCheck /></div>}
            </div>
            <div 
              className={`source-option ${streamSource === "both" ? "selected" : ""}`}
              onClick={() => setStreamSource("both")}
            >
              <span className="combined-icon">
                <FaDesktop className="source-icon" />
                <FaVideo className="source-icon" />
              </span>
              <span>Both</span>
              {streamSource === "both" && <div className="selection-indicator"><FaCheck /></div>}
            </div>
          </div>
        </div>

        {/* Screen audio option */}
        {(streamSource === "screen" || streamSource === "both") && (
          <div className="form-group inline-checkbox">
            <input
              type="checkbox"
              id="screen-audio"
              checked={screenWithAudio}
              onChange={() => setScreenWithAudio(!screenWithAudio)}
            />
            <label htmlFor="screen-audio">Include audio from screen share</label>
          </div>
        )}

        {/* Terms and conditions checkbox */}
        <div className="terms-container">
          <input
            type="checkbox"
            id="terms-checkbox"
            checked={acceptedTerms}
            onChange={() => setAcceptedTerms(!acceptedTerms)}
          />
          <label htmlFor="terms-checkbox">
            I accept the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>
          </label>
        </div>

        {/* Start streaming button */}
        <button 
          className={`stream-button ${acceptedTerms && socketConnected ? "enabled" : "disabled"}`}
          onClick={startStream}
          disabled={isLoading || !acceptedTerms || !socketConnected}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              <span>Preparing Stream...</span>
            </>
          ) : (
            <>🎥 Start Streaming</>
          )}
        </button>
        
        {/* Connection status */}
        {!socketConnected && !streamError && (
          <div className="connection-status">
            <p>Waiting for server connection...</p>
            <button onClick={() => window.location.reload()}>
              Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamSetup;