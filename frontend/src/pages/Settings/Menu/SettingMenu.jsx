import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import "./SettingMenu.css";
import { clearAuth } from "../../../lib/api";

export default function SettingMenu() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    clearAuth(); // Clear JWT tokens (access and refresh)
    setShowLogoutConfirm(false);
    // Use replace: true to prevent back button from returning to authenticated pages
    navigate("/", { replace: true });
  };


  return (
    <>
      <div className="settings-page">
        <button
          className="close-btn"
          aria-label="Close"
          onClick={() => navigate("/map")}
          title="Back to settings"
          type="button"
        >
          ✕
        </button>

        <nav className="settings-left-nav" aria-label="Settings navigation">
          <h2 className="settings-title">Settings</h2>
          <ul className="settings-menu">
            <li><Link className="settings-block" to="/change-password">Change Password</Link></li>
            <li><Link className="settings-block" to="/default-route-options">Default route options</Link></li>
            {/* <li><Link className="settings-block" to="/preferences">Preferences</Link></li>
            <li><Link className="settings-block" to="/display">Display</Link></li>
            <li><Link className="settings-block" to="/saved-places">My Saved Places</Link></li>
            <li><Link className="settings-block" to="/help">Help and Service</Link></li> */}
          </ul>

          <button
            className="settings-block logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            Log Out
          </button>
        </nav>

        <div className="settings-content">
          <div className="settings-welcome">
            <h1>Settings</h1>
            <p>Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      {showLogoutConfirm && createPortal(
        <div className="logout-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-box" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="logout-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}