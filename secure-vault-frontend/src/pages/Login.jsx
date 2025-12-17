// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      // Use AuthContext.login so loadUser() runs and ProtectedRoute works
      await login(username, password);

      navigate("/dashboard"); // go to dashboard AFTER AuthContext.user is set
    } catch (error) {
      console.error(error);

      if (error.response?.data) {
        setErr(JSON.stringify(error.response.data));
      } else {
        setErr("Invalid username or password");
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">🔐 Secure Vault</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          {err && <p className="login-error">{err}</p>}

          <input
            className="login-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn-login">Login</button>
        </form>

        <p className="login-switch">
          Need an account? <Link to="/signup">Signup</Link>
        </p>
      </div>
    </div>
  );
}