import React, { useState } from "react";
import "../styles/MultistepForm.css";

const MultistepForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    usage: "",
    role: "",
  });

  const usageOptions = [
    { label: "Live Trading", icon: "📈" },
    { label: "Live Podcast", icon: "🎙️" },
    { label: "Live Chatrooms", icon: "💬" },
    { label: "Webinars", icon: "📅" },
  ];

  const roleOptions = [
    { label: "Trader", icon: "📊" },
    { label: "Investor", icon: "💰" },
    { label: "Prop Firm", icon: "🏦" },
    { label: "Broker", icon: "🔗" },
    { label: "Financial Analyst", icon: "📉" },
    { label: "Financial Blogger", icon: "📝" },
  ];

  const handleSelection = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="form-container">
      <div className="form-box">
        {step === 1 && (
          <div className="step">
            <h2>How do you plan on using Trader Stream?</h2>
            <p>Select one option to continue.</p>
            <div className="options-grid">
              {usageOptions.map((option) => (
                <div
                  key={option.label}
                  className={`option-card ${formData.usage === option.label ? "selected" : ""}`}
                  onClick={() => handleSelection("usage", option.label)}
                >
                  <span className="icon">{option.icon}</span>
                  {option.label}
                  {formData.usage === option.label && <span className="checkmark">✔</span>}
                </div>
              ))}
            </div>
            <button className="next-btn" onClick={nextStep} disabled={!formData.usage}>
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step">
            <h2>What is your current role?</h2>
            <p>Select one option to continue.</p>
            <div className="options-grid">
              {roleOptions.map((option) => (
                <div
                  key={option.label}
                  className={`option-card ${formData.role === option.label ? "selected" : ""}`}
                  onClick={() => handleSelection("role", option.label)}
                >
                  <span className="icon">{option.icon}</span>
                  {option.label}
                  {formData.role === option.label && <span className="checkmark">✔</span>}
                </div>
              ))}
            </div>
            <div className="button-group">
              <button className="back-btn" onClick={prevStep}>
                Back
              </button>
              <button className="submit-btn" disabled={!formData.role}>
                Submit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Mockup Preview */}
      <div className="mockup-section">
        <h3>Preview</h3>
        <div className="mockup-placeholder">
          <p>Reserved for mockup content</p>
        </div>
      </div>
    </div>
  );
};

export default MultistepForm;
