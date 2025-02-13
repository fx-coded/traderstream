import React, { useState } from "react";
import "../styles/global.css"; // Updated styles in a separate file for clarity

const AuthModal = ({ type, setShowAuthModal, setUser }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [useEmail, setUseEmail] = useState(true); // Toggle for phone/email signup
  const [authType, setAuthType] = useState(type);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // If signing up, check password confirmation
    if (authType === "signup" && formData.password !== formData.confirmPassword) {
      setError("⚠ Passwords do not match!");
      return;
    }

    // Mock authentication - Replace with API later
    setUser({
      username: formData.username,
      profilePic: "https://via.placeholder.com/50",
      experience: Math.floor(Math.random() * 10) + 1,
      instruments: "Forex, Crypto",
      bio: "Passionate trader navigating the markets!",
    });

    setShowAuthModal(null);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-header">
          <h2>{authType === "login" ? "🔑 Login" : "🚀 Join TradeStream"}</h2>
          <button className="close-btn" onClick={() => setShowAuthModal(null)}>✖</button>
        </div>

        <form onSubmit={handleSubmit}>
          {authType === "signup" && (
            <>
              <label>Username:</label>
              <input 
                type="text" 
                name="username" 
                placeholder="Choose a unique username" 
                value={formData.username} 
                onChange={handleChange} 
                required 
              />

              <label>Sign up with:</label>
              <div className="toggle-email-phone">
                <button 
                  type="button" 
                  className={useEmail ? "active" : ""}
                  onClick={() => setUseEmail(true)}
                >
                  Email
                </button>
                <button 
                  type="button" 
                  className={!useEmail ? "active" : ""}
                  onClick={() => setUseEmail(false)}
                >
                  Phone
                </button>
              </div>

              {useEmail ? (
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Enter your email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              ) : (
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="Enter your phone number" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  required 
                />
              )}

              <label>Date of Birth:</label>
              <div className="dob-container">
                <select name="birthDay" value={formData.birthDay} onChange={handleChange} required>
                  <option value="">Day</option>
                  {[...Array(31)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>

                <select name="birthMonth" value={formData.birthMonth} onChange={handleChange} required>
                  <option value="">Month</option>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <option key={i} value={m}>{m}</option>
                  ))}
                </select>

                <select name="birthYear" value={formData.birthYear} onChange={handleChange} required>
                  <option value="">Year</option>
                  {[...Array(100)].map((_, i) => (
                    <option key={i} value={2025 - i}>{2025 - i}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <label>Password:</label>
          <div className="password-container">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder="Enter Password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
            <button 
              type="button" 
              className="toggle-password" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {authType === "signup" && (
            <>
              <label>Confirm Password:</label>
              <div className="password-container">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  placeholder="Re-enter Password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required 
                />
                <button 
                  type="button" 
                  className="toggle-password" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </>
          )}

          {error && <p className="error-message">{error}</p>}

          {authType === "login" && (
            <p className="forgot-password">❓ <span>Forgot Password?</span></p>
          )}

          <button type="submit" className="auth-btn">
            {authType === "login" ? "🚀 Login" : "🆕 Sign Up"}
          </button>
        </form>

        <p>
          {authType === "login" ? "New here?" : "Already have an account?"} 
          <span className="switch-auth" onClick={() => setAuthType(authType === "login" ? "signup" : "login")}>
            {authType === "login" ? " Sign Up" : " Login"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
