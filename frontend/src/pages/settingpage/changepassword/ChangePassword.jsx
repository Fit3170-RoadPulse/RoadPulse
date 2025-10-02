import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // <-- added useNavigate
import "./ChangePassword.css";

function SidebarIcon({ children }) {
  return <div className="sidebar-icon">{children}</div>;
}

export default function ChangePassword() {
  const [values, setValues] = useState({ current: "", newPass: "", repeat: "" });
  const [show, setShow] = useState({ current: false, newPass: false, repeat: false });
  const [msg, setMsg] = useState(null);

  const navigate = useNavigate(); // <-- must import this!

  const handleChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });
  const toggle = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));

  const validate = () => {
    if (!values.current || !values.newPass || !values.repeat) return "Please fill in all fields.";
    if (values.newPass.length < 8) return "New password must be at least 8 characters long.";
    if (values.newPass !== values.repeat) return "The two new password entries do not match.";
    if (values.current === values.newPass) return "New password cannot be the same as the current password.";
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }

    // TODO: call API to change password here (axios/fetch)
    setMsg({ type: "success", text: "New password has been updated." });
    setValues({ current: "", newPass: "", repeat: "" });
  };

  return (
    <div className="setting-menu-page">
      {/* Close button in top-right */}
      <button
        className="close-btn"
        aria-label="Close"
        onClick={() => navigate("/setting-menu-page")}
        title="Back to settings"
      >
        {/* simple SVG X icon */}
        {/* <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg> */}
      X
      </button>

      {/* left rail */}
      <aside className="app-left-rail" aria-hidden>
        <div className="rail-icons">
          <SidebarIcon><svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /></svg></SidebarIcon>
          <SidebarIcon><svg width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></SidebarIcon>
          <SidebarIcon><svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 12h18" /></svg></SidebarIcon>
        </div>
      </aside>

      {/* left menu */}
      <nav className="settings-left-nav" aria-label="Settings menu">
        <div className="settings-header">
          <button className="settings-badge" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
            <span>Settings</span>
          </button>
        </div>

        <ul className="settings-menu">
          <li className="menu-item"><Link to="/change-password">Change Password</Link></li>
          <li className="menu-item"><Link to="/preferences">Preferences</Link></li>
          <li className="menu-item"><Link to="/display">Display</Link></li>
          <li className="menu-item"><Link to="/saved-places">My Saved Places</Link></li>
          <li className="menu-item"><Link to="/help">Help and Service</Link></li>
        </ul>

        <div className="settings-logout">Log Out</div>
      </nav>

      {/* right hand side */}
      <main className="settings-content" role="main">
        <div className="settings-panel change-password-panel" aria-labelledby="change-password-heading">
          <h2 id="change-password-heading">Change password</h2>

          {msg && <div className={`msg ${msg.type === "error" ? "error" : "success"}`}>{msg.text}</div>}

          <form className="change-password-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="form-label">Current password</label>
              <div className="input-with-action">
                <input
                  name="current"
                  type={show.current ? "text" : "password"}
                  className="form-input"
                  value={values.current}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button type="button" className="icon-btn" onClick={() => toggle("current")} aria-label="Toggle current password visibility">
                  {show.current ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">New password</label>
              <div className="input-with-action">
                <input
                  name="newPass"
                  type={show.newPass ? "text" : "password"}
                  className="form-input"
                  value={values.newPass}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                <button type="button" className="icon-btn" onClick={() => toggle("newPass")} aria-label="Toggle new password visibility">
                  {show.newPass ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">Repeat password</label>
              <div className="input-with-action">
                <input
                  name="repeat"
                  type={show.repeat ? "text" : "password"}
                  className="form-input"
                  value={values.repeat}
                  onChange={handleChange}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
                <button type="button" className="icon-btn" onClick={() => toggle("repeat")} aria-label="Toggle repeat password visibility">
                  {show.repeat ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div className="form-actions">
              <Link to="/setting-menu-page" className="btn outline">Back</Link>
              <button type="submit" className="btn primary">Save</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
