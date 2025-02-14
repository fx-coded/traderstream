import React from "react";
import "../styles/global.css";

const Footer = () => {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Trader Stream. All Rights Reserved.</p>
      <div className="footer-links">
        <a href="/terms">Terms of Service</a> | 
        <a href="/privacy">Privacy Policy</a> | 
        <a href="/contact">Contact Us</a>
      </div>
    </footer>
  );
};

export default Footer;
