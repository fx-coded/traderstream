import React, { useEffect, useState } from "react";
import { auth } from "../firebaseConfig"; // Ensure Firebase is configured
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/global.css"

const AuthAction = () => {
  const [actionMode, setActionMode] = useState(null);
  const [oobCode, setOobCode] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract query parameters from the URL
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");
    const code = searchParams.get("oobCode");

    setActionMode(mode);
    setOobCode(code);
  }, [location]);

  // 📌 Handle Email Verification
  useEffect(() => {
    if (actionMode === "verifyEmail" && oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => {
          setSuccess(true);
          setTimeout(() => navigate("/"), 3000);
        })
        .catch((err) => setError("⚠ Email verification failed."));
    }
  }, [actionMode, oobCode, navigate]);

  // 📌 Handle Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("⚠ Password must be at least 6 characters long.");
      return;
    }

    try {
      await verifyPasswordResetCode(auth, oobCode);
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError("⚠ Password reset failed.");
    }
  };

  return (
    <div className="auth-action-container">
      {actionMode === "verifyEmail" && success && (
        <p className="success-message">✅ Email verified! Redirecting...</p>
      )}

      {actionMode === "resetPassword" && (
        <form onSubmit={handlePasswordReset} className="reset-password-form">
          <h2>🔑 Reset Password</h2>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit">Reset Password</button>
        </form>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default AuthAction;
