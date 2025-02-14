import React, { useEffect, useState } from "react";
import { auth } from "../firebaseConfig"; // Ensure Firebase is configured
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset, checkActionCode, sendPasswordResetEmail } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/global.css";

const AuthAction = () => {
  const [actionMode, setActionMode] = useState(null);
  const [oobCode, setOobCode] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract query parameters from the URL
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");
    const code = searchParams.get("oobCode");

    setActionMode(mode);
    setOobCode(code);

    if (code) {
      checkActionCode(auth, code)
        .then((info) => {
          setEmail(info.data.email || "");
        })
        .catch(() => {
          setError("⚠️ This link has expired or is invalid. Please request a new one.");
        });
    }
  }, [location]);

  // 📌 Handle Email Verification
  useEffect(() => {
    if (actionMode === "verifyEmail" && oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => {
          setSuccess(true);
          setTimeout(() => navigate("/"), 3000);
        })
        .catch(() => {
          setError("⚠️ Email verification link has expired or is invalid. Please request a new one.");
        });
    }
  }, [actionMode, oobCode, navigate]);

  // 📌 Handle Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("⚠️ Password must be at least 6 characters long.");
      return;
    }

    try {
      await verifyPasswordResetCode(auth, oobCode);
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch {
      setError("⚠️ Password reset link has expired or is invalid. Request a new link below.");
    }
  };

  // 📌 Request New Password Reset Link
  const requestNewPasswordReset = async () => {
    if (!email) {
      setError("⚠️ Unable to request a new reset link. Try again later.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("✅ A new password reset link has been sent to your email.");
    } catch {
      setError("⚠️ Failed to send a new password reset link. Please try again.");
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

      {error && (
        <div className="error-message">
          <p>{error}</p>
          {actionMode === "resetPassword" && (
            <button onClick={requestNewPasswordReset} className="resend-link-btn">
              🔄 Request New Password Reset Link
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthAction;
