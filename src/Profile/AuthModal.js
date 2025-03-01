import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { getDocs, collection, query, where, setDoc, doc, getDoc } from "firebase/firestore";
import "../styles/global.css";

// Create provider outside component to avoid recreating on each render
const googleProvider = new GoogleAuthProvider();

const AuthModal = ({ type = "login", setShowAuthModal, setUser }) => {
  // State management
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [viewState, setViewState] = useState({
    showPassword: false,
    showConfirmPassword: false,
    showForgotPassword: false,
  });
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Reset form errors when switching views
  useEffect(() => {
    setError("");
    setFormErrors({});
    setResetEmailSent(false);
  }, [type, viewState.showForgotPassword]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (type === "signup") {
      // Username validation
      if (!formData.username.trim()) {
        errors.username = "Username is required";
      } else if (!isValidUsername(formData.username)) {
        errors.username = "Username can only contain letters, numbers, and '_'";
      }
      
      // Email validation
      if (!formData.email) {
        errors.email = "Email is required";
      } else if (!isValidEmail(formData.email)) {
        errors.email = "Please enter a valid email address";
      }
      
      // Password validation
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }
      
      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    } else {
      // Login validation
      if (!formData.email) {
        errors.email = "Username or email is required";
      }
      
      if (!formData.password) {
        errors.password = "Password is required";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Input handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear specific error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
    setError("");
  };

  const toggleVisibility = (field) => {
    setViewState({ ...viewState, [field]: !viewState[field] });
  };

  // Validation helpers
  const isValidUsername = (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Firebase auth handlers
  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setError("Please enter your email to reset the password");
      return;
    }
    
    if (!isValidEmail(resetEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetEmailSent(true);
      setError("");
    } catch (err) {
      setError(getReadableErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // Create a new user document if first time sign-in
        const username = user.email.split('@')[0] + Math.floor(Math.random() * 1000);
        await setDoc(doc(db, "users", user.uid), {
          username,
          email: user.email,
          emailVerified: true,
          createdAt: new Date(),
          provider: "google"
        });
      }
      
      setUser({ uid: user.uid, email: user.email });
      setShowAuthModal(null);
    } catch (err) {
      setError(getReadableErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (type === "signup") {
        // Check if username already exists
        const userQuery = query(
          collection(db, "users"),
          where("username", "==", formData.username)
        );
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          setFormErrors({ ...formErrors, username: "Username is already taken" });
          setLoading(false);
          return;
        }

        // Email/Password Sign Up
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
          emailVerified: false,
          createdAt: new Date(),
          provider: "email"
        });

        setError("Verification email sent! Please check your inbox.");
        // Clear form after successful signup
        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        // LOGIN LOGIC: Email OR Username Support
        let emailToUse = formData.email;

        if (!formData.email.includes("@")) {
          // Assume user entered a username, so look up the email in Firestore
          const userQuery = query(
            collection(db, "users"),
            where("username", "==", formData.email)
          );
          const querySnapshot = await getDocs(userQuery);

          if (querySnapshot.empty) {
            setFormErrors({ ...formErrors, email: "Username not found" });
            setLoading(false);
            return;
          }

          // Retrieve email from Firestore
          emailToUse = querySnapshot.docs[0].data().email;
        }

        // Email Login
        const userCredential = await signInWithEmailAndPassword(
          auth,
          emailToUse,
          formData.password
        );

        // Check if the email is verified before allowing access
        if (!userCredential.user.emailVerified) {
          setError("Please verify your email before logging in");
          // Option to resend verification email
          await sendEmailVerification(userCredential.user);
          setLoading(false);
          return;
        }

        setUser({ uid: userCredential.user.uid, email: emailToUse });
        setShowAuthModal(null);
      }
    } catch (err) {
      setError(getReadableErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert Firebase error codes to readable messages
  const getReadableErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email format',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later',
      'auth/popup-closed-by-user': 'Sign-in popup was closed before completing the sign in',
      'auth/cancelled-popup-request': 'The popup sign-in was cancelled',
      'auth/popup-blocked': 'The sign-in popup was blocked by your browser',
      'auth/weak-password': 'Password should be at least 6 characters'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  };

  // Render forgot password view
  if (viewState.showForgotPassword) {
    return (
      <div className="auth-overlay">
        <div className="auth-modal">
          <div className="auth-header">
            <h2>🔑 Reset Password</h2>
            <button 
              className="close-btn" 
              onClick={() => setShowAuthModal(null)}
              aria-label="Close"
            >
              ✖
            </button>
          </div>
          
          <p>Enter your email below, and we'll send you a reset link.</p>
          
          <div className="form-group">
            <input
              type="email"
              name="resetEmail"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className={error ? "input-error" : ""}
              required
            />
          </div>
          
          {error && <p className="error-message">{error}</p>}
          {resetEmailSent && <p className="success-message">✅ Check your email for the reset link.</p>}
          
          <div className="button-group">
            <button 
              className="auth-btn-modal primary" 
              onClick={handleForgotPassword}
              disabled={loading}
            >
              {loading ? "Sending..." : "📩 Send Reset Link"}
            </button>
            
            <button 
              className="auth-btn-modal secondary" 
              onClick={() => setViewState({...viewState, showForgotPassword: false})}
              disabled={loading}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main auth form
  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-header">
          <h2>{type === "login" ? "🔑 Login" : "🚀 Join TradeStream"}</h2>
          <button 
            className="close-btn" 
            onClick={() => setShowAuthModal(null)}
            aria-label="Close"
          >
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {type === "signup" && (
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Choose a unique username"
                value={formData.username}
                onChange={handleChange}
                className={formErrors.username ? "input-error" : ""}
                required
              />
              {formErrors.username && <p className="field-error">{formErrors.username}</p>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              {type === "login" ? "Username or Email:" : "Email:"}
            </label>
            <input
              id="email"
              type={type === "signup" ? "email" : "text"}
              name="email"
              placeholder={type === "login" ? "Enter your username or email" : "Enter your email"}
              value={formData.email}
              onChange={handleChange}
              className={formErrors.email ? "input-error" : ""}
              required
            />
            {formErrors.email && <p className="field-error">{formErrors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <div className="password-container">
              <input
                id="password"
                type={viewState.showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                className={formErrors.password ? "input-error" : ""}
                required
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => toggleVisibility('showPassword')}
                aria-label={viewState.showPassword ? "Hide password" : "Show password"}
              >
                {viewState.showPassword ? "👁️" : "🙈"}
              </button>
            </div>
            {formErrors.password && <p className="field-error">{formErrors.password}</p>}
          </div>

          {type === "signup" && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <div className="password-container">
                <input
                  id="confirmPassword"
                  type={viewState.showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={formErrors.confirmPassword ? "input-error" : ""}
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password" 
                  onClick={() => toggleVisibility('showConfirmPassword')}
                  aria-label={viewState.showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {viewState.showConfirmPassword ? "👁️" : "🙈"}
                </button>
              </div>
              {formErrors.confirmPassword && <p className="field-error">{formErrors.confirmPassword}</p>}
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          {type === "login" && (
            <p 
              className="forgot-password" 
              onClick={() => setViewState({...viewState, showForgotPassword: true})}
            >
              ❓ Forgot Password?
            </p>
          )}

          <button 
            type="submit" 
            className="auth-btn-modal primary" 
            disabled={loading}
          >
            {loading ? "⏳ Processing..." : type === "login" ? "🚀 Login" : "🆕 Sign Up"}
          </button>
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <button 
            type="button" 
            className="auth-btn-modal google" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v3.73h5.31c-0.24,1.61-1.78,4.12-5.31,4.12c-3.2,0-5.8-2.65-5.8-5.92s2.6-5.92,5.8-5.92 c1.83,0,3.05,0.77,3.75,1.45l2.55-2.45C16.42,4.3,14.38,3.28,12,3.28c-4.98,0-9,4.04-9,9s4.02,9,9,9c5.2,0,8.65-3.65,8.65-8.79 C20.65,11.94,21.01,11.1,21.35,11.1z" fill="#4285F4"></path>
              </g>
            </svg>
            Continue with Google
          </button>
          
          <p className="switch-auth-type">
            {type === "login" 
              ? "Don't have an account? " 
              : "Already have an account? "}
            <span 
              onClick={() => setShowAuthModal(type === "login" ? "signup" : "login")}
              className="auth-link"
            >
              {type === "login" ? "Sign up" : "Log in"}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;