import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { FaGithub } from 'react-icons/fa';
import { IoMdMail } from 'react-icons/io';
import { BsLinkedin } from 'react-icons/bs';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-section footer-brand">
          <div className="footer-logo">
            <h3>SWAT</h3>
            <p>Anomaly Detection System</p>
          </div>
          <p className="footer-description">
            Advanced machine learning-based anomaly detection for industrial water treatment systems
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Features</Link></li>
            <li><Link to="/">Models</Link></li>
            <li><Link to="/">How It Works</Link></li>
            <li><a href="#documentation">Documentation</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-section">
          <h4>Resources</h4>
          <ul className="footer-links">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/reports">Reports</Link></li>
            <li><Link to="/alerts">Alerts</Link></li>
            <li><Link to="/sensors">Sensors</Link></li>
          </ul>
        </div>

        {/* Social Links */}
        <div className="footer-section">
          <h4>Connect</h4>
          <div className="footer-socials">
            <a href="#github" className="social-link" title="GitHub">
              <FaGithub size={20} />
            </a>
            <a href="#linkedin" className="social-link" title="LinkedIn">
              <BsLinkedin size={20} />
            </a>
            <a href="mailto:contact@swat.com" className="social-link" title="Email">
              <IoMdMail size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} SWAT Anomaly Detection System. All rights reserved.</p>
        <div className="footer-legal">
          <a href="#privacy">Privacy Policy</a>
          <span>•</span>
          <a href="#terms">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
