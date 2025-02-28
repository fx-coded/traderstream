import React from 'react';
import '../styles/LoadingSpinner.css'; // We'll create this CSS file next

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p>Loading Trade Streamer...</p>
    </div>
  );
};

export default LoadingSpinner;