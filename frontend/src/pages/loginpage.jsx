// src/pages/SettingsDisplay.jsx
import React from "react";

/**
 * Pure presentational Settings component.
 * - Props:
 *   - onSave(values)  optional callback when Save clicked
 *   - onCancel()      optional callback when Cancel clicked
 * Usage: <SettingsDisplay onSave={(v)=>...} onCancel={()=>...} />
 */
export default function LoginPage({ onSave, onCancel }) {
  // Local UI state only for the visual demo
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [darkMode, setDarkMode] = React.useState(false);

  function handleSave() {
    const values = { username, email, darkMode };
    if (typeof onSave === "function") onSave(values);
    else alert("Save pressed — values: " + JSON.stringify(values, null, 2));
  }

  function handleCancel() {
    if (typeof onCancel === "function") onCancel();
    else {
      // reset UI only (presentation-only behavior)
      setUsername("");
      setEmail("");
      setDarkMode(false);
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your passsword"
        />
      </div>

      {/* <div style={{ ...styles.field, ...styles.row }}>
        <input
          id="darkToggle"
          type="checkbox"
          checked={darkMode}
          onChange={(e) => setDarkMode(e.target.checked)}
          style={{ marginRight: 10 }}
        />
        <div>
          <div style={{ fontWeight: 600 }}>Enable dark mode</div>
          <div style={styles.muted}>Visual toggle only (presentation)</div>
        </div>
      </div> */}

      <div style={styles.buttons}>
        <button onClick={handleSave} style={styles.primaryBtn}>
          Login
        </button>
      </div>
    </div>
  );
}

/* Inline styles for the demo */
const styles = {
  root: {
    padding: 24,
    maxWidth: 720,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
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
};