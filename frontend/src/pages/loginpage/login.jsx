import React from "react";
import "./login.css";

export default function LoginPage({ onLogin, onCancel, onForgotPassword }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);

  function handleLogin() {
    const values = { username, password, remember };
    if (typeof onLogin === "function") onLogin(values);
    else alert("Login pressed — values: " + JSON.stringify(values, null, 2));
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
    <div className="login-root">
      <h1 className="login-title">Welcome Back!</h1>
      <p className="login-hint">Enter your username and password to login.</p>

      <div className="login-field">
        <label className="login-label">Username</label> 
        <input
          className="login-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
        </div>

        <div className="login-field">
        <label className="login-label">Password</label>
        <input
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          type="password"
        />
        <button onClick={handleForgotPassword} className="login-linkBtn">
          Forgot password?
        </button>
      </div>

      <div className="login-buttons">
        <button onClick={handleLogin} className="login-primaryBtn">
          Login
        </button>
      </div>
    </div>
  );
}

