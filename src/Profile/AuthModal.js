import React, { useState } from "react";
import { auth, db } from "../firebaseConfig"; // Ensure Firebase is configured
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getDocs, collection, query, where, setDoc, doc } from "firebase/firestore";
import "../styles/global.css";

const AuthModal = ({ type, setShowAuthModal, setUser }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // 📌 Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  // 📌 Toggle Show/Hide Password
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // 📌 Validate Username (only letters, numbers, and `_`)
  const isValidUsername = (username) => /^[a-zA-Z0-9_]+$/.test(username);

  // 📌 Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setError("⚠ Please enter your email to reset the password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetEmailSent(true);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // 📌 Sign Up / Login Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === "signup") {
        if (!isValidUsername(formData.username)) {
          setError("❌ Username can only contain letters, numbers, and '_'.");
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError("⚠ Passwords do not match!");
          setLoading(false);
          return;
        }

        // ✅ Check if username already exists
        const userQuery = query(
          collection(db, "users"),
          where("username", "==", formData.username)
        );
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          setError("❌ Username is already taken.");
          setLoading(false);
          return;
        }

        // 🔥 Email/Password Sign Up
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Send Email Verification
        await sendEmailVerification(userCredential.user);

        // Store user in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          username: formData.username,
          email: formData.email,
          emailVerified: false, // Store verification status
        });

        setError("✅ Verification email sent! Please check your inbox.");
        setLoading(false);
        return; // 🚀 Stop further execution until email is verified
      } else {
        // 🔥 LOGIN LOGIC: Email OR Username Support
        let emailToUse = formData.email;

        if (!formData.email.includes("@")) {
          // Assume user entered a username, so look up the email in Firestore
          const userQuery = query(
            collection(db, "users"),
            where("username", "==", formData.email)
          );
          const querySnapshot = await getDocs(userQuery);

          if (querySnapshot.empty) {
            setError("❌ Username not found!");
            setLoading(false);
            return;
          }

          // Retrieve email from Firestore
          emailToUse = querySnapshot.docs[0].data().email;
        }

        // 🔥 Email Login
        const userCredential = await signInWithEmailAndPassword(
          auth,
          emailToUse,
          formData.password
        );

        // ✅ Check if the email is verified before allowing access
        if (!userCredential.user.emailVerified) {
          setError("⚠ Please verify your email before logging in.");
          setLoading(false);
          return;
        }

        setUser({ uid: userCredential.user.uid, email: emailToUse });
      }

      setShowAuthModal(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-header">
          <h2>{type === "login" ? "🔑 Login" : "🚀 Join TradeStream"}</h2>
          <button className="close-btn" onClick={() => setShowAuthModal(null)}>✖</button>
        </div>

        {showForgotPassword ? (
          <>
            <h3>🔑 Forgot Password</h3>
            <p>Enter your email below, and we'll send you a reset link.</p>
            <input
              type="email"
              name="resetEmail"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <button className="auth-btn" onClick={handleForgotPassword}>
              📩 Send Reset Link
            </button>
            {resetEmailSent && <p className="success-message">✅ Check your email for the reset link.</p>}
            <button className="back-btn" onClick={() => setShowForgotPassword(false)}>← Back to Login</button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {type === "signup" && (
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
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </>
            )}

            {type === "login" && (
              <>
                <label>Username or Email:</label>
                <input
                  type="text"
                  name="email"
                  placeholder="Enter your username or email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
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
              <button type="button" className="toggle-password" onClick={togglePasswordVisibility}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {type === "signup" && (
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
                  <button type="button" className="toggle-password" onClick={toggleConfirmPasswordVisibility}>
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </>
            )}

            {error && <p className="error-message">{error}</p>}

            <p className="forgot-password" onClick={() => setShowForgotPassword(true)}>❓ Forgot Password?</p>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "⏳ Processing..." : type === "login" ? "🚀 Login" : "🆕 Sign Up"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
