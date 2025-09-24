// src/pages/LoginPage.jsx
import React from "react";

/**
 * Presentational login component.
 * Props:
 *  - onLogin(credentials)         optional, called when Login pressed
 *  - onCancel()                   optional, called when Cancel pressed
 *  - onForgotPassword(email)      optional, called when Forgot password pressed
 */
export default function LoginPage({ onLogin, onCancel, onForgotPassword }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);

  function handleLogin() {
    const values = { username, password, remember };
    if (typeof onLogin === "function") onLogin(values);
    else alert("Login pressed — values: " + JSON.stringify(values, null, 2));
  }

  function handleCancel() {
    if (typeof onCancel === "function") onCancel();
    else {
      setUsername("");
      setPassword("");
      setRemember(false);
    }
  }

  function handleForgotPassword() {
    // prefer using the username/email if available
    const identifier = username || "";
    if (typeof onForgotPassword === "function") {
      onForgotPassword(identifier);
    } else {
      // demo behaviour
      alert(
        identifier
          ? `Forgot password clicked — will send reset to account: ${identifier}`
          : "Forgot password clicked — no username/email provided."
      );
    }
  }

  return (
    <div style={styles.root}>
      <h1 style={styles.h1}>Welcome Back!</h1>
      <p style={styles.hint}>Enter your username and password to login.</p>

      <div style={styles.field}>
        <label style={styles.label}>Username</label>
        <input
          style={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          type="password"
        />
        <button onClick={handleForgotPassword} style={styles.linkBtn}>
          Forgot password?
        </button>
      </div>


      <div style={styles.buttons}>
        <button onClick={handleLogin} style={styles.primaryBtn}>
          Login
        </button>
      </div>
    </div>
  );
}

/* styles copied/adjusted from your version */
const styles = {
  root: {
    padding: 24,
    maxWidth: 720,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  },
  h1: { margin: 0, marginBottom: 6 },
  hint: { marginTop: 0, color: "#666", marginBottom: 18 },
  field: { marginBottom: 14, display: "block" },
  label: { display: "block", marginBottom: 6, fontWeight: 600 },
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 14,
  },
  row: { display: "flex", alignItems: "center" },
  muted: { color: "#666", fontSize: 13 },
  buttons: { marginTop: 18, display: "flex", gap: 10 },
  primaryBtn: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "#0b74de",
    color: "white",
  },
  secondaryBtn: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
  },
  linkBtn: {
    marginTop: 6,
    padding: 0,
    border: "none",
    background: "none",
    color: "#666",
    // textDecoration: "underline",
    cursor: "pointer",
    fontSize: 14,
  },
};