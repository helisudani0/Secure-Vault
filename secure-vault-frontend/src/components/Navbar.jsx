import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">

      {/* LEFT SIDE: LOGO + TITLE */}
      <div className="navbar-left">
        <div className="logo-circle">SV</div>

        <div className="nav-text-group">
          <Link to="/dashboard" className="nav-title">
            Secure Vault
          </Link>
          <div className="nav-subtitle">Encrypted Cloud Storage</div>
        </div>
      </div>

      {/* RIGHT SIDE: AUTH BUTTONS */}
      <div className="navbar-right">
        {user ? (
          <>
            <span className="nav-username">Hello, {user.username}</span>
            <button className="nav-logout" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-login">Login</Link>
            <Link to="/signup" className="nav-signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}
