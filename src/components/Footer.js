import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-info">
            <p className="footer-copyright">
              © {currentYear} Trader Stream. All Rights Reserved.
            </p>
            <div className="footer-links">
              <Link to="/terms">Terms of Service</Link>
              <span className="footer-divider">•</span>
              <Link to="/privacy">Privacy Policy</Link>
              <span className="footer-divider">•</span>
              <Link to="/contact">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;