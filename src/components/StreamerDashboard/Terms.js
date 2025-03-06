import React from "react";

const TermsAndConditions = ({
  acceptedTerms,
  setAcceptedTerms
}) => {
  return (
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
      
      {/* Optional additional information about terms */}
      <div className="terms-info">
        <p className="terms-note">
          By starting a stream, you agree to comply with our community guidelines and streaming policies.
        </p>
      </div>
    </div>
  );
};

export default TermsAndConditions;