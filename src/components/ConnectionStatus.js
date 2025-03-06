import React from 'react';

const ConnectionStatus = ({ socketConnected, connectionError }) => {
  if (socketConnected) {
    return null; // Don't show anything when connected
  }
  
  return (
    <div className={`connection-status ${connectionError ? 'error' : 'warning'}`}>
      <span className="status-icon">
        {connectionError ? '⚠️' : '🔄'}
      </span>
      <span className="status-message">
        {connectionError 
          ? `Connection failed: ${connectionError}` 
          : 'Connecting to server...'}
      </span>
      {connectionError && (
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;