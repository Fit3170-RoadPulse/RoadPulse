import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

// check with database
const validatePassword = (password) => {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  // check for at least on letter
  if (!/[a-zA-Z]/.test(password)) {
    return "Password must include at least one letter.";
  }

  // check for at least one number
  if (!/\d/.test(password)) {
    return "Password must include at least one number (0-9).";
  }

  // check for at least one special character
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "Password must include at least one special character";
  }
  return null;
};

// const validateEmail = (email) => {
//   // Basic regex check for email format
//   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//     return "Please enter a valid email address.";
//   }
//   return null;
// };

const validateUsername = (username) => {
  if (username.length < 3) {
    return "Username must be at least 3 characters long.";
  }
  return null;
};

export default function LoginPage({ onLogin, onForgotPassword }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate();
  const [show, setShow] = useState({ current: false });
  const toggle = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));

  function toggleShowPassword() {
    setShowPassword((s) => !s);
  }

  function handleLogin() {
    setErrorMessage(""); // clear previous errors

    // validate username
    let error = validateUsername(username);
    // if (error) return setErrorMessage(error);
    if (error) {
      alert(error);
      return;
    }

    // // validate email
    // error = validateEmail(email);
    // // if (error) return setErrorMessage(error);
    // if (error) {
    //   alert(error);
    //   return;
    // }

    // validate password
    error = validatePassword(password);
    // if (error) return setErrorMessage(error);
    if (error) {
      alert(error);
      return;
    }

    const values = { username, password };

    const isLoginSuccessful = true;

    if (isLoginSuccessful) {
      if (typeof onLogin === "function") {
        onLogin(values);
      }

      navigate("/map"); // navigate to verification page
    } else {
      alert("Registration failed. Please try again");
    }
  }

  function handleForgotPassword() {
    const identifier = username || "";
    if (typeof onForgotPassword === "function") {
      onForgotPassword(identifier);
    } else {
      alert(
        identifier
          ? `Forgot password clicked — will send reset to account: ${identifier}`
          : "Forgot password clicked — no username/email provided."
      );
    }
  }

  return (
    <div className="login-container">
      <h1 className="login-title">Welcome Back!</h1>
      <p className="login-hint">Enter your username and password to login.</p>

      <div className="login-field">
        <label className="login-label">Username:</label>
        <input
          className="login-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
      </div>

      <div className="login-field">
        <label className="login-label">Password:</label>
        <input
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          type={show.current ? "text" : "password"}
        />

        <button
          type="button"
          className="login-icon-btn"
          onClick={() => toggle("current")}
          aria-label="Toggle new password visibility"
        >
          {show.current ? "👁️" : "🙈"}
        </button>
      </div>

      <div className="forgot-password-link-container">
        <button
          onClick={handleForgotPassword}
          className="forgot-password-link"
          type="button"
        >
          Forgot password?
        </button>
      </div>

      <div className="login-buttons">
        {/* <Link handleLogin className="login-primaryBtn">
          Login
        </Link> */}
        <button
          onClick={handleLogin}
          className="login-primaryBtn"
          type="button"
        >
          Login
        </button>
      </div>
    </div>
  );
}
