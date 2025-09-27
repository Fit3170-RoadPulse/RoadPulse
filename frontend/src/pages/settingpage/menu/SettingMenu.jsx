// src/pages/settingpage/menu/SettingMenu.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./SettingMenu.css";

function SidebarIcon({ children }) {
  return <div className="sidebar-icon">{children}</div>;
}

export default function SettingMenu() {
  return (
    <div className="setting-menu-page">
      <aside className="app-left-rail">
        <div className="rail-icons">
          <SidebarIcon>
            <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /></svg>
          </SidebarIcon>
          <SidebarIcon>
            <svg width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
          </SidebarIcon>
          <SidebarIcon>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 12h18" /></svg>
          </SidebarIcon>
        </div>
      </aside>

      <nav className="settings-left-nav">
        <div className="settings-header">
          <button className="settings-badge">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M12 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 7l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
            <span>Settings</span>
          </button>
        </div>

        <ul className="settings-menu">
          <li className="menu-item">
            {/* Link 填满整行（样式会让 a 占满 li） */}
            <Link to="/change-password">Change Password</Link>
          </li>

          <li className="menu-item">
            <Link to="/preferences">Preferences</Link>
          </li>

          <li className="menu-item">
            <Link to="/display">Display</Link>
          </li>

          <li className="menu-item">
            <Link to="/saved-places">My Saved Places</Link>
          </li>

          <li className="menu-item">
            <Link to="/help">Help and Service</Link>
          </li>
        </ul>

        <div className="settings-logout">Log Out</div>
      </nav>
    </div>
  );
}
