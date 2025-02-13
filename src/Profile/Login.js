import React, { useState } from "react";
import "../styles/auth.css"; // Ensure styles are in auth.css

const Login = ({ setShowAuthModal }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    alert("Login functionality to be implemented!");
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-header">
          <h2>🔑 Login to TradeStream</h2>
          <button className="close-btn" onClick={() => setShowAuthModal(null)}>✖ Close</button>
        </div>

        <form onSubmit={handleLogin}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password:</label>
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <p className="forgot-password">❓ <span>Forgot Password?</span></p>

          <button type="submit" className="login-btn">🚀 Login</button>
        </form>

        <p>New here? <span className="switch-auth" onClick={() => setShowAuthModal("signup")}>Sign Up</span></p>
      </div>
    </div>
  );
};

export default Login;
