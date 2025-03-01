import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import "../styles/auth.css";

const Login = ({ setShowAuthModal }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Close modal on successful login
      setShowAuthModal(null);
    } catch (error) {
      console.error("Login error:", error);
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          setLoginError("Invalid email or password");
          break;
        case "auth/too-many-requests":
          setLoginError("Too many failed login attempts. Please try again later");
          break;
        case "auth/user-disabled":
          setLoginError("This account has been disabled");
          break;
        default:
          setLoginError("An error occurred during login. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setLoginError("Please enter your email address to reset your password");
      return;
    }

    setResetLoading(true);
    setLoginError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (error) {
      console.error("Password reset error:", error);
      
      switch (error.code) {
        case "auth/user-not-found":
          setLoginError("No account found with this email address");
          break;
        case "auth/invalid-email":
          setLoginError("Please enter a valid email address");
          break;
        default:
          setLoginError("Could not send reset email. Please try again later");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-header">
          <h2>🔑 Login to TradeStream</h2>
          <button className="close-btn" onClick={() => setShowAuthModal(null)}>✖ Close</button>
        </div>

        {loginError && <div className="auth-error">{loginError}</div>}
        
        {resetEmailSent && (
          <div className="auth-success">
            Password reset email sent! Please check your inbox.
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || resetLoading}
              required
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || resetLoading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || resetLoading}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <p className="forgot-password">
            <span 
              onClick={handleForgotPassword}
              className={resetLoading ? "disabled-link" : ""}
            >
              {resetLoading ? "Sending reset email..." : "❓ Forgot Password?"}
            </span>
          </p>

          <button 
            type="submit" 
            className={`login-btn ${loading ? "loading-btn" : ""}`}
            disabled={loading || resetLoading}
          >
            {loading ? "Logging in..." : "🚀 Login"}
          </button>
        </form>

        <p className="auth-switch">
          New here? <span className="switch-auth" onClick={() => setShowAuthModal("signup")}>Sign Up</span>
        </p>
      </div>
    </div>
  );
};

export default Login;