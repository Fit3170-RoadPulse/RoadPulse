import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SettingMenu.css";

export default function SettingMenu() {
  const navigate = useNavigate();
  
  return (
    <div className="settings-page">

      <button
        className="settings-close-btn"
        aria-label="Close settings"
        onClick={() => navigate("/")}
        title="Back to app"
      >
        ✕
      </button>

      <nav className="settings-left-nav" aria-label="Settings navigation">
        <ul className="settings-menu">
          <li><Link className="settings-block" to="/change-password">Change Password</Link></li>
          <li><Link className="settings-block" to="/preferences">Preferences</Link></li>
          <li><Link className="settings-block" to="/display">Display</Link></li>
          <li><Link className="settings-block" to="/saved-places">My Saved Places</Link></li>
          <li><Link className="settings-block" to="/help">Help and Service</Link></li>
        </ul>
        <Link className="settings-block settings-logout" to="/logout">Log Out</Link>
      </nav>
    </div>
  );
}