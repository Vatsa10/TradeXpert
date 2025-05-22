import React from "react";
import { useTheme } from '../../context/ThemeContext';
import '../../styles/Footer.css';

function Footer() {
  const { theme } = useTheme();

  return (
    <footer className={`footer ${theme}`}>
      <div className="footer-content">
        <div className="footer-section">
          <h3>Product</h3>
          <ul className="footer-links">
            <li><a href="/premium">Premium</a></li>
            <li><a href="/whats-new">What's new?</a></li>
            <li><a href="/learn">Learn</a></li>
            <li><a href="/terms-privacy">Terms & Privacy</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Contact</h3>
          <p>No: 99999999</p>
          <p>GJ, India</p>
          <p><a href="mailto:tradexpert@sample.com">tradexpert@sample.com</a></p>
        </div>
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Follow Us</h3>
          <ul className="footer-links">
            <li><a href="https://twitter.com">Twitter</a></li>
            <li><a href="https://facebook.com">Facebook</a></li>
            <li><a href="https://linkedin.com">LinkedIn</a></li>
            <li><a href="https://instagram.com">Instagram</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 TradeXpert - All Rights Reserved</p>
      </div>
    </footer>
  );
}

export default Footer;
