import React, { useState } from "react";
import "../styles/global.css";

const Signup = ({ setShowAuthModal }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();
    alert("Signup functionality to be implemented!");
  };

  return (
    <div className="auth-modal">
      <div className="auth-content">
        <h2>🚀 Sign Up for TradeStream</h2>
        <form onSubmit={handleSignup}>
          <label>Username:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />

          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <button type="submit">✅ Create Account</button>
        </form>
        <p>Already have an account? <span onClick={() => setShowAuthModal("login")}>Login</span></p>
        <button className="close-btn" onClick={() => setShowAuthModal(null)}>❌</button>
      </div>
    </div>
  );
};

export default Signup;
