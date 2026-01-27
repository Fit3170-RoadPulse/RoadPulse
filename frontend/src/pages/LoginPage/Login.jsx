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

const validateEmail = (email) => {
  // Basic regex check for email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }
  return null;
};

export default function LoginPage({ onLogin, onForgotPassword }) {
  // const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [show, setShow] = useState({ current: false });
  const toggle = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));

  function toggleShowPassword() {
    setShowPassword((s) => !s);
  }

  async function handleLogin() {
    setErrorMessage(""); // clear previous errors

    // validate email
    let error = validateEmail(email);
    if (error) {
      setErrorMessage(error);
      return;
    }

    // validate password
    error = validatePassword(password);
    if (error) {
      setErrorMessage(error);
      return;
    }

    try {
      const base = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${base}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const text = await res.text(); // get raw response
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON response:", text);
        alert("Server error occurred. Check console.");
        return;
      }

      if (res.ok) {
        const access = String(data.access || "")
          .trim()
          .replace(/^Bearer\s+/i, "")
          .replace(/^\"+|\"+$/g, "");
        const refresh = String(data.refresh || "")
          .trim()
          .replace(/^Bearer\s+/i, "")
          .replace(/^\"+|\"+$/g, "");
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        localStorage.setItem("is_staff", !!data.is_staff);
        window.dispatchEvent(new Event("rp:auth-changed"));

        if (typeof onLogin === "function") onLogin({ email, password });

        // Use replace: true to remove login page from history
        // This prevents back button from returning to login after successful login
        navigate("/map", { replace: true });
      } else {
        setErrorMessage(data.detail || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Network or fetch error:", err);
      setErrorMessage("Network error. Check backend server.");
    }
  }

  // function handleForgotPassword() {
  //   const identifier = email || "";
  //   if (typeof onForgotPassword === "function") {
  //     onForgotPassword(identifier);
  //   } else {
  //     alert(
  //       identifier
  //         ? `Forgot password clicked — will send reset to account: ${identifier}`
  //         : "Forgot password clicked — no username/email provided."
  //     );
  //   }
  // }
  async function handleForgotPassword() {
    setErrorMessage(""); // clear previous errors
    if (!email) {
      setErrorMessage("Please enter your email.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/forgot-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (res.ok) {
        setErrorMessage("✅ Reset code sent to your email.");
      } else if (res.status === 404) {
        setErrorMessage("❌ No account found with this email.");
      } else {
        setErrorMessage(data.detail || "An error occurred. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error. Check backend server.");
    }
  }

  return (
    <div className="login-page-wrapper">
      <div className="car-1">🚗</div>
      <div className="car-2">🚙</div>

      <div className="pedestrian-1">🚶</div>
      <div className="pedestrian-2">🚶‍♀️</div>

      <div className="tree-1">🌳</div>
      <div className="tree-2">🌲</div>
      <div className="tree-3">🌳</div>

      <div className="cloud-1">☁️</div>
      <div className="cloud-2">☁️</div>
      <div className="cloud-3">☁️</div>

      <div className="login-container">
        <h1 className="login-title">Welcome to RoadPulse!</h1>
        <p className="login-hint">Navigate your journey with confidence</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          {errorMessage && <div className="login-error">{errorMessage}</div>}

          <div className="login-field">
            <label className="login-label">Email:</label>
            <input
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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

          {/* <div className="forgot-password-link-container">
            <button
              onClick={handleForgotPassword}
              className="forgot-password-link"
              type="button"
            >
              Forgot password?
            </button>
          </div> */}

          <div className="login-buttons">
            <button
              // onClick={handleLogin}
              className="login-primaryBtn"
              type="submit"
            >
              Login
            </button>
          </div>
        </form>

        <div className="register-link-container">
          <p className="register-text">
            Don't have an account?{" "}
            <Link to="/registration-page" className="register-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
