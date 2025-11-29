import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import "./Navbar.css";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName =
    user?.full_name || user?.name || user?.email?.split("@")[0] || "User";

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🌊</span>
          <span className="logo-text">SWAT</span>
        </Link>

        {/* Mobile Menu Icon */}
        <button
          className={`hamburger ${isOpen ? "active" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {/* Navigation Menu */}
        <ul className={`nav-menu ${isOpen ? "active" : ""}`}>
          <li className="nav-item">
            <a href="/#features" className="nav-link">
              Features
            </a>
          </li>

          <li className="nav-item">
            <a href="/#models" className="nav-link">
              Models
            </a>
          </li>

          <li className="nav-item">
            <a href="/#how-it-works" className="nav-link">
              How It Works
            </a>
          </li>
        </ul>

        {/* USER ICON + DROPDOWN */}
        {user ? (
          <div className="user-dropdown-container">
            <button
              className="user-icon-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {displayName.charAt(0).toUpperCase()}
            </button>

            {dropdownOpen && (
              <div className="user-dropdown">
                <div className="dropdown-email">{user.email}</div>

                <Link to="/dashboard" className="dropdown-item">
                  Dashboard
                </Link>

                <button className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="nav-link nav-auth">
              Login
            </Link>
            <Link to="/signup" className="nav-link nav-signup">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
