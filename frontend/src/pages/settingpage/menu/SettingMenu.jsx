import React from "react";
import { Link } from "react-router-dom";
import "./SettingMenu.css";

export default function SettingMenu() {
  return (
    <div className="settings-page">
      <nav className="settings-left-nav" aria-label="Settings navigation">

        <ul className="settings-menu">
          <li className="menu-item"><Link to="/change-password">Change Password</Link></li>
          <li className="menu-item"><Link to="/preferences">Preferences</Link></li>
          <li className="menu-item"><Link to="/display">Display</Link></li>
          <li className="menu-item"><Link to="/saved-places">My Saved Places</Link></li>
          <li className="menu-item"><Link to="/help">Help and Service</Link></li>
        </ul>

        <div className="settings-logout">Log Out</div>
      </nav>
    </div>
  );
}

