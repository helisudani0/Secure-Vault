// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/auth"; // use updated auth.js
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [confirmLoginPassword, setConfirmLoginPassword] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [strength, setStrength] = useState("");
  const [err, setErr] = useState("");

  // Password strength evaluation
  function evaluateStrength(pw) {
    let score = 0;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return "Weak";
    if (score === 3) return "Medium";
    return "Strong";
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (loginPassword !== confirmLoginPassword) {
      return setErr("Login passwords do not match.");
    }

    if (masterPassword.length < 12) {
      return setErr("Master password must be at least 12 characters.");
    }

    try {
      await registerUser(username, loginPassword, masterPassword);
      navigate("/dashboard"); // redirect on success
    } catch (error) {
      console.error(error);
      // show backend validation errors if available
      if (error.response?.data) {
        setErr(JSON.stringify(error.response.data));
      } else {
        setErr("Unable to create account.");
      }
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-card">
        <h1 className="signup-title">Create Your Secure Vault</h1>
        <p className="signup-subtitle">
          Your master password is never stored — losing it means permanent loss of encrypted files.
        </p>

        <form onSubmit={handleSubmit} className="signup-form">
          {err && <p className="error-message">{err}</p>}

          <input
            type="text"
            className="signup-input"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            className="signup-input"
            placeholder="Login password"
            value={loginPassword}
            onChange={(e) => {
              setLoginPassword(e.target.value);
              setStrength(evaluateStrength(e.target.value));
            }}
            required
          />

          <input
            type="password"
            className="signup-input"
            placeholder="Confirm login password"
            value={confirmLoginPassword}
            onChange={(e) => setConfirmLoginPassword(e.target.value)}
            required
          />

          {loginPassword && (
            <p className={`strength strength-${strength.toLowerCase()}`}>
              Password strength: {strength}
            </p>
          )}

          <input
            type="password"
            className="signup-input"
            placeholder="Master password (used for encryption)"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            required
          />

          <div className="signup-actions">
            <button className="btn-signup">Create Account</button>
          </div>
        </form>

        <p className="signup-bottom">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
