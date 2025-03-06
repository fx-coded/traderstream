import React, { useState } from "react";
import "./streamForm.css";

const StreamForm = ({
  streamTitle,
  setStreamTitle,
  category,
  setCategory,
  description,
  setDescription,
  categories
}) => {
  const [streamSource, setStreamSource] = useState('camera');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleStreamSource = (source) => {
    setStreamSource(source);
  };

  return (
    <div className="stream-form-container">
      <h1 className="start-stream-header">Start Your Stream</h1>
      
      <div className="stream-form">
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
            {categories.map((cat) => (
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
        
        {/* Stream source options */}
        <div className="stream-source">
          <h3 className="stream-source-title">Stream Source</h3>
          <div className="source-options">
            <div className="source-option">
              <input 
                type="radio" 
                id="camera-option" 
                name="stream-source" 
                checked={streamSource === 'camera'}
                onChange={() => handleStreamSource('camera')}
              />
              <label htmlFor="camera-option">Camera</label>
            </div>
            <div className="source-option">
              <input 
                type="radio" 
                id="screen-option" 
                name="stream-source" 
                checked={streamSource === 'screen'}
                onChange={() => handleStreamSource('screen')}
              />
              <label htmlFor="screen-option">Screen</label>
            </div>
            <div className="source-option">
              <input 
                type="radio" 
                id="both-option" 
                name="stream-source" 
                checked={streamSource === 'both'}
                onChange={() => handleStreamSource('both')}
              />
              <label htmlFor="both-option">Both</label>
            </div>
          </div>
        </div>
        
        {/* Terms and conditions */}
        <div className="terms-container">
          <input 
            type="checkbox" 
            id="terms-checkbox"
            checked={acceptTerms}
            onChange={() => setAcceptTerms(!acceptTerms)}
          />
          <label htmlFor="terms-checkbox">I accept the <a href="#">Terms & Conditions</a></label>
        </div>
        
        <button 
          className="start-streaming-btn"
          disabled={!acceptTerms || !streamTitle || !category}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z"></path>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
          Start Streaming
        </button>
      </div>
    </div>
  );
};

export default StreamForm;