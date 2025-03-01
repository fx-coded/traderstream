import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import "../styles/global.css";

const Signup = ({ setShowAuthModal }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [loading, setLoading] = useState(false);

  // Username validation rules
  const validateUsername = (value) => {
    // Reset errors
    setUsernameError("");
    
    // Username must be at least 3 characters
    if (value.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }
    
    // Username must be alphanumeric (with underscores allowed)
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return false;
    }
    
    // Username cannot be longer than 20 characters
    if (value.length > 20) {
      setUsernameError("Username cannot be longer than 20 characters");
      return false;
    }
    
    return true;
  };

  // Check username availability with debounce
  useEffect(() => {
    let timeoutId;
    
    if (username.length >= 3) {
      setIsCheckingUsername(true);
      
      // Clear any existing timeout
      clearTimeout(timeoutId);
      
      // Set a new timeout to avoid excessive checking
      timeoutId = setTimeout(async () => {
        try {
          if (validateUsername(username)) {
            // Check if username exists in Firestore
            const usernameQuery = query(
              collection(db, "users"),
              where("usernameLC", "==", username.toLowerCase())
            );
            
            const querySnapshot = await getDocs(usernameQuery);
            
            if (querySnapshot.empty) {
              setUsernameAvailable(true);
              setUsernameError("");
            } else {
              setUsernameAvailable(false);
              setUsernameError("Username is already taken");
            }
          }
        } catch (error) {
          console.error("Error checking username:", error);
        } finally {
          setIsCheckingUsername(false);
        }
      }, 500); // 500ms debounce
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [username]);

  // Password validation
  const validatePassword = (value) => {
    setPasswordError("");
    
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    
    return true;
  };

  // Form validation
  const validateForm = () => {
    let isValid = true;
    
    // Validate username
    if (!validateUsername(username)) {
      isValid = false;
    } else if (!usernameAvailable) {
      setUsernameError("Username is already taken");
      isValid = false;
    }
    
    // Validate password
    if (!validatePassword(password)) {
      isValid = false;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      isValid = false;
    }
    
    return isValid;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setSignupError("");
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      const user = userCredential.user;
      
      // Update profile with username
      await updateProfile(user, {
        displayName: username
      });
      
      // Store additional user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: username,
        usernameLC: username.toLowerCase(), // For case-insensitive queries
        email: email,
        createdAt: new Date(),
        photoURL: user.photoURL || null,
        bio: "",
        followers: [],
        following: []
      });
      
      // Close modal after successful signup
      setShowAuthModal(null);
      
    } catch (error) {
      console.error("Error during signup:", error);
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case "auth/email-already-in-use":
          setSignupError("Email is already in use");
          break;
        case "auth/invalid-email":
          setSignupError("Invalid email address");
          break;
        case "auth/weak-password":
          setSignupError("Password is too weak");
          break;
        default:
          setSignupError("An error occurred during signup. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-content">
        <h2>🚀 Sign Up for TradeStream</h2>
        
        {signupError && <div className="auth-error">{signupError}</div>}
        
        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label>Username:</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value.trim())} 
              className={usernameError ? "input-error" : ""}
              disabled={loading}
              required 
            />
            {isCheckingUsername && <div className="checking-message">Checking availability...</div>}
            {usernameError && <div className="field-error">{usernameError}</div>}
            {username.length >= 3 && !isCheckingUsername && usernameAvailable && !usernameError && (
              <div className="field-success">Username is available</div>
            )}
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              disabled={loading}
              required 
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }} 
              className={passwordError ? "input-error" : ""}
              disabled={loading}
              required 
            />
            {passwordError && <div className="field-error">{passwordError}</div>}
          </div>
          
          <div className="form-group">
            <label>Confirm Password:</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className={passwordError && password !== confirmPassword ? "input-error" : ""}
              disabled={loading}
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || isCheckingUsername || !usernameAvailable}
            className={loading ? "loading-btn" : ""}
          >
            {loading ? "Creating Account..." : "✅ Create Account"}
          </button>
        </form>
        
        <p>Already have an account? <span className="link" onClick={() => setShowAuthModal("login")}>Login</span></p>
        <button className="close-btn" onClick={() => setShowAuthModal(null)}>❌</button>
      </div>
    </div>
  );
};

export default Signup;